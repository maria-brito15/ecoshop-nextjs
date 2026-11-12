// services/photo.service.ts

/**
 * PHOTO SERVICE
 *
 * Service for managing product photos.
 *
 * Photos are stored on the file system (public/data_photos/)
 * and served as static files by Next.js.
 *
 * Business rules:
 * - Allowed extensions: .jpg, .jpeg, .png, .gif, .webp
 * - Maximum size: 5MB
 * - Sanitized names to avoid collisions and path traversal
 * - Name format: {productId}_{timestamp}_{random}.{ext}
 *
 * Security:
 * - Extension validation (whitelist)
 * - Size validation (5MB max)
 * - Name sanitization (removes special characters)
 * - Path traversal protection (path.basename)
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";
import {
  detectImageType,
  extensionMatchesType,
} from "@/lib/media/image-type";

/**
 * Directory where photos are stored.
 * Absolute path to avoid ambiguity.
 */
const PHOTOS_DIR = path.join(process.cwd(), "public/data_photos");

/**
 * Maximum file size: 5MB.
 * Value chosen to balance image quality and performance.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed file extensions (whitelist).
 * All are common formats on smartphone cameras.
 */
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Checks whether the file extension is on the whitelist.
 *
 * @param filename - File name (e.g. "photo.jpg")
 * @returns true if the extension is allowed
 */
function hasAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Generates a sanitized, unique name for the file.
 *
 * Format: {productId}_{custom or timestamp_random}.{ext}
 * Example: "123_my_product_photo.jpg" or "123_1702900000_abc123.jpg"
 *
 * @param productId - ID of the associated product
 * @param originalName - Original file name (to extract the extension)
 * @param custom - Optional custom name (sanitized)
 * @returns Sanitized, unique name
 */
function buildFileName(
  productId: number,
  originalName: string,
  custom?: string | null,
): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = custom
    ? custom.replace(/[^a-zA-Z0-9]/g, "_")
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${productId}_${base}${ext}`;
}

/**
 * Lists all photos of a product.
 *
 * @param productId - Product ID
 * @returns Object with the photo array, total and productId
 */
export async function listPhotos(productId: number) {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    const photos = files
      .filter((file) => file.startsWith(`${productId}_`))
      .map((name) => ({ name, url: `/data_photos/${name}` }));
    return { photos, total: photos.length, productId };
  } catch {
    // Directory does not exist or read error
    return { photos: [], total: 0, productId };
  }
}

export type UploadFailureReason =
  | "PRODUCT_NOT_FOUND"
  | "EXTENSION_NOT_ALLOWED"
  | "FILE_TOO_LARGE"
  | "CONTENT_NOT_IMAGE"
  | "NAME_ALREADY_EXISTS";

export type UploadResult =
  | { ok: true; photo: { name: string; url: string } }
  | { ok: false; reason: UploadFailureReason };

/**
 * Validates and writes the photo to `directory` (no database access; exported for tests).
 *
 * Flow: extension → size → real CONTENT (byte signature, REQ-MIDIA-06)
 * → sanitized name → exclusive write.
 *
 * The write uses the `wx` flag (fails if the file already exists): it settles the race
 * between two simultaneous uploads with the same name, instead of checking the
 * directory listing first and overwriting afterwards (REQ-MIDIA-07).
 */
export async function savePhoto(params: {
  productId: number;
  file: File;
  customName?: string | null;
  directory: string;
}): Promise<UploadResult> {
  const { productId, file, customName, directory } = params;

  if (!hasAllowedExtension(file.name)) {
    return { ok: false, reason: "EXTENSION_NOT_ALLOWED" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: "FILE_TOO_LARGE" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type || !extensionMatchesType(path.extname(file.name), type)) {
    return { ok: false, reason: "CONTENT_NOT_IMAGE" };
  }

  const fileName = buildFileName(productId, file.name, customName);

  await fs.mkdir(directory, { recursive: true });
  try {
    await fs.writeFile(path.join(directory, fileName), buffer, { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      return { ok: false, reason: "NAME_ALREADY_EXISTS" };
    }
    throw err;
  }

  return {
    ok: true,
    photo: { name: fileName, url: `/data_photos/${fileName}` },
  };
}

/**
 * Uploads a new photo for a product.
 *
 * Flow: check that the product exists → `savePhoto` → invalidate the photo cache.
 *
 * @param params - Upload parameters
 * @returns Operation result (ok with the photo, or an error with a reason)
 */
export async function uploadPhoto(params: {
  productId: number;
  file: File;
  customName?: string | null;
}): Promise<UploadResult> {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { id: true },
  });
  if (!product) return { ok: false, reason: "PRODUCT_NOT_FOUND" };

  const result = await savePhoto({ ...params, directory: PHOTOS_DIR });
  if (result.ok) await invalidateCache("PHOTOS");
  return result;
}

/**
 * Deletes a specific photo of a product.
 *
 * Security checks:
 * - The name must start with {productId}_ (prevents deleting other products' photos)
 * - Uses path.basename to prevent path traversal
 *
 * @param params - Deletion parameters
 * @returns Operation result (ok, or an error with a reason)
 */
export async function deletePhoto(params: {
  productId: number;
  fileName: string;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "INVALID_NAME" | "FILE_NOT_FOUND" }
> {
  const { productId, fileName } = params;

  // Check that the file belongs to the product
  if (!fileName.startsWith(`${productId}_`)) {
    return { ok: false, reason: "INVALID_NAME" };
  }

  // Path traversal protection
  const sanitizedName = path.basename(fileName);
  if (
    sanitizedName !== fileName ||
    sanitizedName === "." ||
    sanitizedName === ".."
  ) {
    return { ok: false, reason: "INVALID_NAME" };
  }

  const filePath = path.join(PHOTOS_DIR, sanitizedName);

  // Check that the file exists
  try {
    await fs.access(filePath);
  } catch {
    return { ok: false, reason: "FILE_NOT_FOUND" };
  }

  // Delete the file
  await fs.unlink(filePath);
  await invalidateCache("PHOTOS");

  return { ok: true };
}
