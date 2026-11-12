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
 * - POST /api/certificados
 * - PUT /api/certificados/:id
 */

import { z } from "zod";

/**
 * Schema for creating a new certificate.
 *
 * Rules:
 * - nome: required, not empty (e.g. "Cruelty Free", "Organic Brazil")
 * - descricao: optional — details of what the seal guarantees
 * - orgaoEmissor: required, not empty (the certifying entity)
 *
 * @example
 * const data = {
 *   nome: "Cruelty Free",
 *   descricao: "Ensures the product was not tested on animals",
 *   orgaoEmissor: "PETA"
 * };
 */
export const certificateSchema = z.object({
  nome: z.string().min(1, "Certificate name is required"),
  descricao: z.string().optional(),
  orgaoEmissor: z.string().min(1, "Issuing body is required"),
});

/**
 * Schema for updating an existing certificate.
 *
 * ALL fields are optional — allows partial updates.
 * Useful to fix a single field without sending all of them.
 *
 * Rules (when present):
 * - nome: minimum 1 character
 * - descricao: free string
 * - orgaoEmissor: minimum 1 character
 *
 * @example
 * // Fix the issuing body
 * const data = { orgaoEmissor: "IBD Institute" };
 *
 * // Update only the description
 * const data = { descricao: "International certification of organic products" };
 */
export const updateCertificateSchema = z.object({
  nome: z.string().min(1, "Name cannot be empty").optional(),
  descricao: z.string().optional(),
  orgaoEmissor: z
    .string()
    .min(1, "Issuing body cannot be empty")
    .optional(),
});

// Inferred types for use in the services
export type CertificateInput = z.infer<typeof certificateSchema>;
export type UpdateCertificateInput = z.infer<
  typeof updateCertificateSchema
>;
