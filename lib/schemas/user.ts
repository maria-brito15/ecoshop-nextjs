// lib/schemas/user.ts

/**
 * USER SCHEMAS (Zod)
 *
 * Validation schemas for user-related operations.
 *
 * Why Zod?
 * - Declarative validation with TypeScript type inference
 * - Customizable error messages
 * - Protection against malicious data (automatic sanitization)
 *
 * This file contains schemas for:
 * - Login (email + password)
 * - Public registration (anyone can create an account)
 * - Admin registration (an admin can create users of any type)
 * - Profile update (a user editing their own data)
 *
 * IMPORTANT: Passwords are never validated in plain text beyond the minimum length.
 * Password security is the backend's responsibility (bcrypt).
 */

import { z } from "zod";

/**
 * Normalized email: no surrounding spaces and lowercase (REQ-AUTH-15).
 * Normalization happens before the format check.
 */
const emailSchema = z.string().trim().toLowerCase().email("Invalid email");

/**
 * bcrypt only uses the first 72 bytes of the password: the rest would be silently
 * ignored. Counts bytes (UTF-8), not characters, and uses `TextEncoder`, which
 * also exists in the browser (REQ-AUTH-16).
 */
const PASSWORD_MAX_BYTES = 72;
const passwordSchema = z
  .string()
  .min(8, "Password must have at least 8 characters")
  .refine(
    (password) => new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES,
    `Password must have at most ${PASSWORD_MAX_BYTES} bytes`,
  );

/**
 * Validation schema for login.
 *
 * Rules:
 * - email: valid format (e.g. user@domain.com)
 * - password: not empty (minimum 1 character)
 *
 * NOTE: We do not validate a minimum password length on login because
 * older users may have short passwords (from before the 8-character rule).
 * Length validation is applied only on registration.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for user registration performed by an ADMIN.
 *
 * It differs from public registration by allowing:
 * - The user type (CUSTOMER, BRAND, ADMIN)
 *
 * Rules:
 * - name: minimum 3 characters
 * - email: valid format
 * - phone: optional, free string
 * - password: minimum 8 characters (OWASP security recommendation)
 * - type: enum with default "CUSTOMER"
 *
 * @example
 * const data = {
 *   name: "John Smith",
 *   email: "john@example.com",
 *   password: "password123456",
 *   type: "ADMIN"
 * };
 */
export const adminRegistrationSchema = z.object({
  name: z.string().min(3, "Name must have at least 3 characters"),
  email: emailSchema,
  phone: z.string().optional(),
  password: passwordSchema,
  type: z.enum(["CUSTOMER", "BRAND", "ADMIN"]).default("CUSTOMER"),
});

/**
 * Schema for public user registration (anyone).
 *
 * Rules:
 * - name: minimum 3 characters
 * - email: valid format
 * - phone: optional, free string
 * - password: minimum 8 characters
 * - type: restricted to CUSTOMER or BRAND (ADMIN cannot be created via public registration)
 * - brandName: required when type is BRAND (REQ-AUTH-14); the brand request
 *   stays pending until an ADMIN approves it (REQ-AUTH-11, ADR-0018)
 *
 * Why restrict ADMIN?
 * - Security: only existing admins can create other admins
 * - Flow: a new user registers as CUSTOMER or BRAND
 */
export const publicRegistrationSchema = z
  .object({
    name: z.string().min(3, "Name must have at least 3 characters"),
    email: emailSchema,
    phone: z.string().optional(),
    password: passwordSchema,
    type: z.enum(["CUSTOMER", "BRAND"]).default("CUSTOMER"),
    brandName: z.string().min(1, "Brand name is required").optional(),
    brandDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BRAND" && !data.brandName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Brand name is required when registering as a brand (BRAND)",
        path: ["brandName"],
      });
    }
  });

/**
 * Schema for updating a user profile.
 *
 * ALL fields are optional — allows partial updates.
 * The user can update only the fields they want.
 *
 * Rules (when present):
 * - name: minimum 3 characters (if provided)
 * - email: valid format (if provided)
 * - phone: free string (if provided)
 * - password: minimum 8 characters (if provided)
 *
 * NOTE: The password is hashed again in the service before saving.
 *
 * @example
 * // Update only the name
 * const data = { name: "John Smith Jr" };
 *
 * // Update name and phone
 * const data = { name: "John", phone: "(11) 99999-8888" };
 *
 * // Update the password
 * const data = { password: "new_secure_password_123" };
 */
export const updateUserSchema = z.object({
  name: z.string().min(3, "Name must have at least 3 characters").optional(),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  password: passwordSchema.optional(),
  // Required to change your OWN password (REQ-AUTH-21); the service decides.
  currentPassword: z.string().min(1, "Current password is required").optional(),
});
