// lib/hooks/usePhotos.ts

/**
 * PHOTOS HOOKS
 *
 * Collection of hooks for managing product photos.
 *
 * Photos are stored on the file system (public/data_photos/)
 * and served as static files.
 *
 * Features:
 * - Upload via FormData (multipart/form-data)
 * - Extension and size validation on the backend
 * - Sanitized names to avoid collisions (format: {productId}_{timestamp}_{random}.ext)
 *
 * Endpoints:
 * - List: GET /api/products/:id/photos
 * - Upload: POST /api/products/:id/photos (admin)
 * - Delete: DELETE /api/products/:id/photos?name={name} (admin)
 */

"use client";

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type { Photo, PhotosResponse } from "@/types/domain";

/**
 * Lists all photos of a specific product.
 *
 * @param productId - Product ID (if 0 or null, the hook does not run)
 * @returns Hook with the photo array, loading and error
 *
 * @example
 * const { data, loading } = useListPhotos(productId);
 * const photos = data?.photos ?? [];
 */
export function useListPhotos(productId: number) {
  return useFetch<PhotosResponse>(`/api/products/${productId}/photos`);
}

/**
 * Uploads a new photo for a product.
 * Requires ADMIN authentication.
 *
 * The request body must be a FormData containing:
 * - file: File (the image)
 * - name: string (optional, custom name)
 *
 * @param productId - ID of the product the photo will be associated with
 * @returns Mutation hook for photo upload
 *
 * @example
 * const upload = useUploadPhoto(productId);
 * const formData = new FormData();
 * formData.append("file", file);
 * const result = await upload.execute(`/api/products/${productId}/photos`, formData);
 */
export function useUploadPhoto(productId: number) {
  return useMutation<{ ok: boolean; photo: Photo; message: string }, FormData>({
    method: "POST",
    invalidate: [`/api/products/${productId}/photos`],
  });
}

/**
 * Deletes a specific photo of a product.
 * Requires ADMIN authentication.
 *
 * @param productId - Product ID
 * @returns Mutation hook for photo deletion
 *
 * @example
 * const remove = useDeletePhoto(productId);
 * await remove.execute(`/api/products/${productId}/photos?name=${fileName}`);
 */
export function useDeletePhoto(productId: number) {
  return useMutation<{ ok: boolean; message: string }>({
    method: "DELETE",
    invalidate: [`/api/products/${productId}/photos`],
  });
}
