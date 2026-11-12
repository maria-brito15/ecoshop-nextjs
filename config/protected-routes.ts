// config/protected-routes.ts

/**
 * PROTECTED ROUTES - CONFIGURATION
 *
 * This file defines the application's route protection rules.
 *
 * The rules are consumed by the middleware (middleware.ts) to:
 * - Redirect unauthenticated users to /sign-in
 * - Block access for users without permission (admin vs. regular authenticated)
 * - Distinguish API responses (JSON) from pages (redirect)
 *
 * Why centralize here?
 * - Keep the security rules in a single place
 * - Easier maintenance and auditing
 * - Avoid rules scattered across the code
 *
 * Protection types:
 * - "admin": only users of type "ADMIN" can access
 * - "authenticated": any signed-in user (CUSTOMER, BRAND, ADMIN) can access
 *
 * Response types:
 * - "api": returns JSON with an error (e.g. { error: "Not authorized" })
 * - "page": redirects to /sign-in with the next parameter
 */

/**
 * Access levels available for route protection.
 *
 * - admin: Only users of type "ADMIN" have permission.
 *          Used for administrative routes (panel, user management).
 *
 * - authenticated: Any signed-in user (CUSTOMER, BRAND or ADMIN) has permission.
 *                  Used for profile routes and personal features.
 */
export type AccessLevel = "admin" | "authenticated";

/**
 * Protection rule for a route or group of routes.
 */
export interface RouteRule {
  /**
   * Prefix of the route to protect.
   * The middleware checks whether the current URL starts with this prefix.
   *
   * @example
   * prefix: "/profile" → protects /profile, /profile/edit, /profile/settings
   * prefix: "/api/admin" → protects /api/admin, /api/admin/users, etc.
   */
  prefix: string;

  /**
   * Minimum required access level.
   * - "admin": only ADMIN can access
   * - "authenticated": any signed-in user can access
   */
  level: AccessLevel;

  /**
   * Response type when access is denied.
   * - "api": returns JSON with status 401/403 (for API endpoints)
   * - "page": redirects to the login page (for page routes)
   */
  responseType: "api" | "page";
}

/**
 * List of route protection rules.
 * The order of the rules does NOT matter because the middleware checks
 * whether the URL STARTS WITH the prefix (startsWith).
 *
 * IMPORTANT: More specific rules must come before generic rules
 * if they overlap. Example:
 * - "/api/admin/users" before "/api/admin"
 *
 * Current rules:
 * 1. /profile → authenticated (any signed-in user can see their profile)
 * 2. /ai-scan → authenticated (REQ-AUTZ-08; the /api/ai/scan API already required login,
 *    but the page opened for any visitor before they tried to upload the photo)
 * 3. /dashboard → admin (only administrators access the panel)
 * 4. /api/users/<id> → authenticated (the middleware only requires a session; who may read/edit each
 *    record is decided in the handler: the user themselves or ADMIN, and only ADMIN lists, creates and deletes.
 *    See ADR-0017 and specs/001-own-user-profile)
 * 5. /api/admin → admin (administrative endpoints)
 */
export const ROUTE_RULES: RouteRule[] = [
  {
    prefix: "/profile",
    level: "authenticated",
    responseType: "page",
  },
  {
    prefix: "/ai-scan",
    level: "authenticated",
    responseType: "page",
  },
  {
    prefix: "/dashboard",
    level: "admin",
    responseType: "page",
  },
  {
    prefix: "/api/users/", // the collection (/api/users: sign-up and ADMIN list) is decided in its handler
    level: "authenticated", // the handler applies "ADMIN or the user themselves" (ADR-0017)
    responseType: "api",
  },
  {
    prefix: "/api/admin",
    level: "admin",
    responseType: "api",
  },
];
