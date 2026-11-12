// lib/media/image-type.ts

/**
 * Recognizes the REAL type of an image from its first bytes ("signature"),
 * instead of trusting the file name extension (REQ-MIDIA-06).
 *
 * A `.png` file that is really HTML or an executable passes an extension-only
 * check; here it is refused.
 */

export type ImageType = "jpeg" | "png" | "gif" | "webp";

/** Extensions (lowercase, with a dot) that each type accepts. */
export const EXTENSIONS_BY_TYPE: Record<ImageType, readonly string[]> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  gif: [".gif"],
  webp: [".webp"],
};

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

/** @returns the image type, or `null` if the bytes are not JPEG, PNG, GIF or WebP. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // "GIF87a" or "GIF89a"
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return "gif";
  }
  // "RIFF" <4-byte size> "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  return null;
}

/** Is the file name extension one of those accepted by the detected type? */
export function extensionMatchesType(extension: string, type: ImageType): boolean {
  return EXTENSIONS_BY_TYPE[type].includes(extension.toLowerCase());
}
