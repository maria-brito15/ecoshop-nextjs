// services/certificate.service.ts

/**
 * CERTIFICATE SERVICE
 *
 * Service layer for sustainability certificate CRUD operations.
 *
 * Certificates are seals attesting that a product meets environmental standards.
 * Examples: "FSC", "Organic Brazil", "Cruelty Free", "Eureciclo".
 *
 * Relationships:
 * - Many-to-many with Products (via ProductCertificate)
 * - A certificate can be assigned to multiple products
 *
 * Cache strategy:
 * - SHORT_LIST (5 min) for complete listings
 * - ITEM (3 min) for individual certificates
 * - Invalidation on write: all keys with the "certificates:*" prefix
 *
 * @see lib/cache/keys.ts - Key generation functions
 * @see lib/cache/ttl.ts - TTL constants
 */

import { prisma } from "@/lib/db";
import { ResourceNotFound } from "@/lib/errors/domain";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  certificatesKey,
  certificateKey,
  TTL,
} from "@/lib/cache";

/**
 * Lists all certificates ordered by name.
 * Public endpoint - certifications are shown on products.
 *
 * Cache: SHORT_LIST (5 minutes)
 * Key: "certificates:list"
 *
 * @returns Array of certificates ordered alphabetically by name
 */
export async function listCertificates() {
  return withCache(certificatesKey(), TTL.SHORT_LIST, () =>
    prisma.certificate.findMany({ orderBy: { name: "asc" } }),
  );
}

/**
 * Fetches a certificate by ID.
 *
 * @param id - Certificate ID
 * @returns The certificate, or null
 */
export async function getCertificate(id: number) {
  return withCache(certificateKey(id), TTL.ITEM, () =>
    prisma.certificate.findUnique({ where: { id } }),
  );
}

/**
 * Creates a new certificate.
 * Requires ADMIN authentication.
 *
 * @param data - Certificate data
 * @param data.name - Certificate name (e.g. "Cruelty Free")
 * @param data.description - Optional description of what the seal guarantees
 * @param data.issuingBody - Responsible entity (e.g. "PETA", "SisOrg")
 * @returns Newly created certificate
 *
 * @example
 * const certificate = await createCertificate({
 *   name: "Cruelty Free",
 *   description: "Not tested on animals",
 *   issuingBody: "PETA"
 * });
 */
export async function createCertificate(data: {
  name: string;
  description?: string;
  issuingBody: string;
}) {
  const certificate = await prisma.certificate.create({ data });
  await invalidateCache("CERTIFICATES");
  return certificate;
}

/**
 * Updates an existing certificate.
 * Requires ADMIN authentication.
 *
 * @param id - ID of the certificate to update
 * @param data - Update data (all optional)
 * @returns Updated certificate
 * @throws Error P2025 if the certificate does not exist
 */
export async function updateCertificate(
  id: number,
  data: { name?: string; description?: string; issuingBody?: string },
) {
  const certificate = await prisma.certificate.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(certificateKey(id)),
    invalidateCache("CERTIFICATES"),
  ]);
  return certificate;
}

/**
 * Deletes a certificate.
 * Requires ADMIN authentication.
 *
 * ATTENTION: Certificates linked to products CANNOT be deleted
 * because of the foreign key constraint in the database.
 *
 * @param id - ID of the certificate to delete
 * @returns true if deleted successfully
 * @throws Error P2025 if the certificate does not exist
 * @throws Error P2003 if the certificate has linked products
 */
export async function deleteCertificate(id: number) {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) {
    throw new ResourceNotFound("Certificate");
  }

  await prisma.certificate.delete({ where: { id } });
  await Promise.all([
    invalidateKey(certificateKey(id)),
    invalidateCache("CERTIFICATES"),
  ]);
  return true;
}
