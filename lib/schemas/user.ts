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
 * - senha: not empty (minimum 1 character)
 *
 * NOTE: We do not validate a minimum password length on login because
 * older users may have short passwords (from before the 8-character rule).
 * Length validation is applied only on registration.
 */
export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, "Password is required"),
});

/**
 * Schema for user registration performed by an ADMIN.
 *
 * It differs from public registration by allowing:
 * - The user type (CLIENTE, MARCA, ADMIN)
 *
 * Rules:
 * - nome: minimum 3 characters
 * - email: valid format
 * - telefone: optional, free string
 * - senha: minimum 8 characters (OWASP security recommendation)
 * - tipo: enum with default "CLIENTE"
 *
 * @example
 * const data = {
 *   nome: "John Smith",
 *   email: "john@example.com",
 *   senha: "password123456",
 *   tipo: "ADMIN"
 * };
 */
export const adminRegistrationSchema = z.object({
  nome: z.string().min(3, "Name must have at least 3 characters"),
  email: emailSchema,
  telefone: z.string().optional(),
  senha: passwordSchema,
  tipo: z.enum(["CLIENTE", "MARCA", "ADMIN"]).default("CLIENTE"),
});

/**
 * Schema for public user registration (anyone).
 *
 * Rules:
 * - nome: minimum 3 characters
 * - email: valid format
 * - telefone: optional, free string
 * - senha: minimum 8 characters
 * - tipo: restricted to CLIENTE or MARCA (ADMIN cannot be created via public registration)
 * - marcaNome: required when tipo is MARCA (REQ-AUTH-14); the brand request
 *   stays pending until an ADMIN approves it (REQ-AUTH-11, ADR-0018)
 *
 * Why restrict ADMIN?
 * - Security: only existing admins can create other admins
 * - Flow: a new user registers as CLIENTE or MARCA
 */
export const publicRegistrationSchema = z
  .object({
    nome: z.string().min(3, "Name must have at least 3 characters"),
    email: emailSchema,
    telefone: z.string().optional(),
    senha: passwordSchema,
    tipo: z.enum(["CLIENTE", "MARCA"]).default("CLIENTE"),
    marcaNome: z.string().min(1, "Brand name is required").optional(),
    marcaDescricao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "MARCA" && !data.marcaNome) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Brand name is required when registering as a brand (MARCA)",
        path: ["marcaNome"],
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
 * - nome: minimum 3 characters (if provided)
 * - email: valid format (if provided)
 * - telefone: free string (if provided)
 * - senha: minimum 8 characters (if provided)
 *
 * NOTE: The password is hashed again in the service before saving.
 *
 * @example
 * // Update only the name
 * const data = { nome: "John Smith Jr" };
 *
 * // Update name and phone
 * const data = { nome: "John", telefone: "(11) 99999-8888" };
 *
 * // Update the password
 * const data = { senha: "new_secure_password_123" };
 */
export const updateUserSchema = z.object({
  nome: z.string().min(3, "Name must have at least 3 characters").optional(),
  email: emailSchema.optional(),
  telefone: z.string().optional(),
  senha: passwordSchema.optional(),
  // Required to change your OWN password (REQ-AUTH-21); the service decides.
  senhaAtual: z.string().min(1, "Current password is required").optional(),
});
