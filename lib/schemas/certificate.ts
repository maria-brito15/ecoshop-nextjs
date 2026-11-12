// lib/schemas/certificate.ts

/**
 * CERTIFICATE SCHEMAS (Zod)
 *
 * Validation schemas for sustainability certificate CRUD operations.
 *
 * Certificates are seals attesting that a product meets environmental standards.
 * Real examples:
 * - Cruelty Free (PETA) → not tested on animals
 * - Organic Brazil (SisOrg) → certified organic products
 * - FSC (Forest Stewardship Council) → responsible forest management
 * - Eureciclo → environmental offsetting of packaging
 *
 * Business rules:
 * - The certificate name is unique in the system
 * - The issuing body is required (e.g. "PETA", "SisOrg", "FSC")
 * - The description is optional
 *
 * Endpoints that use these schemas:
 * - POST /api/certificates
 * - PUT /api/certificates/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new certificate.
 *
 * Rules:
 * - name: required, not empty (e.g. "Cruelty Free", "Organic Brazil")
 * - description: optional — details of what the seal guarantees
 * - issuingBody: required, not empty (the certifying entity)
 *
 * @example
 * const data = {
 *   name: "Cruelty Free",
 *   description: "Ensures the product was not tested on animals",
 *   issuingBody: "PETA"
 * };
 */
export const certificateSchema = z.object({
  name: z.string().min(1, "Certificate name is required"),
  description: z.string().optional(),
  issuingBody: z.string().min(1, "Issuing body is required"),
});

/**
 * Schema for updating an existing certificate.
 *
 * ALL fields are optional — allows partial updates.
 * Useful to fix a single field without sending all of them.
 *
 * Rules (when present):
 * - name: minimum 1 character
 * - description: free string
 * - issuingBody: minimum 1 character
 *
 * @example
 * // Fix the issuing body
 * const data = { issuingBody: "IBD Institute" };
 *
 * // Update only the description
 * const data = { description: "International certification of organic products" };
 */
export const updateCertificateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().optional(),
  issuingBody: z
    .string()
    .min(1, "Issuing body cannot be empty")
    .optional(),
});

// Inferred types for use in the services
export type CertificateInput = z.infer<typeof certificateSchema>;
export type UpdateCertificateInput = z.infer<
  typeof updateCertificateSchema
>;
