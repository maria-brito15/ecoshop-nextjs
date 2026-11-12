// lib/hooks/useCertificates.ts

/**
 * CERTIFICATES HOOKS
 *
 * Collection of hooks for sustainability certificate CRUD operations.
 *
 * Certificates attest that a product meets strict environmental standards.
 * Examples: "FSC", "Organic Brazil", "Eureciclo", "Cruelty Free".
 *
 * Permissions:
 * - GET (list/fetch): public
 * - POST, PUT, DELETE: requires ADMIN authentication
 *
 * Relationships:
 * - Many-to-many with Products (via ProdutoCertificado)
 * - A certificate can be assigned to multiple products
 *
 * Endpoints:
 * - List: GET /api/certificados
 * - Fetch: GET /api/certificados/:id
 * - Create: POST /api/certificados (admin)
 * - Update: PUT /api/certificados/:id (admin)
 * - Delete: DELETE /api/certificados/:id (admin)
 */

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListCertificatesResponse,
  GetCertificateResponse,
  CreateCertificateBody,
  CreateCertificateResponse,
  UpdateCertificateBody,
  UpdateCertificateResponse,
  OkResponse,
} from "@/types/api";

/**
 * Lists all available certificates.
 * Public endpoint — used to show seals on product cards.
 *
 * @returns Hook with the certificate array, loading and error
 */
export function useListCertificates() {
  return useFetch<ListCertificatesResponse>("/api/certificados");
}

/**
 * Fetches a specific certificate by ID.
 *
 * @param id - Certificate ID (if null, the hook does not run)
 * @returns Hook with the certificate data
 */
export function useGetCertificate(id: number | null) {
  return useFetch<GetCertificateResponse>(
    id ? `/api/certificados/${id}` : null,
  );
}

/**
 * Creates a new certificate.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for certificate creation
 *
 * @example
 * const create = useCreateCertificate();
 * await create.execute("/api/certificados", {
 *   nome: "Recicla+",
 *   orgaoEmissor: "Recicla Institute",
 *   descricao: "Certifies that the product is 100% recyclable"
 * });
 */
export function useCreateCertificate() {
  return useMutation<CreateCertificateResponse, CreateCertificateBody>({
    method: "POST",
    invalidate: ["/api/certificados"],
  });
}

/**
 * Updates an existing certificate.
 * Requires ADMIN authentication.
 *
 * @returns Mutation hook for certificate update
 */
export function useUpdateCertificate() {
  return useMutation<UpdateCertificateResponse, UpdateCertificateBody>({
    method: "PUT",
    invalidate: ["/api/certificados"],
  });
}

/**
 * Deletes a certificate.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Certificates linked to products cannot be deleted
 * because of the foreign key constraint.
 *
 * @returns Mutation hook for certificate deletion
 */
export function useDeleteCertificate() {
  return useMutation<OkResponse>({
    method: "DELETE",
    invalidate: ["/api/certificados"],
  });
}
