// lib/http/next-url.ts

/**
 * Validates the `?next=` parameter of the login page (REQ-AUTH-17).
 *
 * Accepts local paths only: starts with ONE slash and has no backslash or
 * control character. Anything else (`//host`, `https://host`,
 * `/\host`, `javascript:`...) goes back to `/`, preventing open redirects.
 */
export function localPathOrRoot(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value;
}
