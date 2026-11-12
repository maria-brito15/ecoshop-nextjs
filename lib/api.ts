// lib/api.ts

/**
 * API BASE URL
 *
 * Provides the base URL for API calls in different environments.
 *
 * The challenge: Next.js runs on both the server and the client.
 * - On the client (browser): a relative URL "/api" works
 * - On the server: an absolute URL is needed (e.g. "https://mysite.com/api")
 *
 * Why this is needed:
 * - fetch on the server does not resolve relative URLs automatically
 * - The NEXT_PUBLIC_SITE_URL environment variable configures the application
 *   domain (useful for deployments with multiple domains)
 */

/**
 * Returns the base URL for API calls.
 *
 * Behavior:
 * - Client (typeof window !== "undefined"): returns "/api"
 * - Server: returns `{NEXT_PUBLIC_SITE_URL}/api` or the fallback "http://localhost:3000/api"
 *
 * @returns {string} API base URL
 *
 * @example
 * const apiBase = getApiBase();
 * await fetch(`${apiBase}/auth/me`);
 */
export function getApiBase(): string {
  // Client mode: URL relative to the current domain.
  // The browser resolves it to the right domain automatically.
  if (typeof window !== "undefined") {
    return "/api";
  }

  // Server mode: needs an absolute URL.
  // NEXT_PUBLIC_SITE_URL must be configured in the production environment.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/api`;
}
