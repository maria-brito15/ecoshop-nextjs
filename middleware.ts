// middleware.ts

/**
 * AUTHENTICATION AND AUTHORIZATION MIDDLEWARE
 *
 * This middleware runs on ALL requests before they reach the routes.
 *
 * Responsibilities:
 * 1. Verify user authentication via the JWT token in the cookies
 * 2. Apply the protection rules defined in config/protected-routes.ts
 * 3. Redirect unauthenticated users to login (page routes)
 * 4. Return a JSON error for APIs when access is denied
 * 5. Check the access level (admin vs. regular authenticated)
 *
 * Execution flow:
 * 1. Extracts the token from the cookie
 * 2. Validates the token and gets the payload (id, email, type)
 * 3. Checks whether the current route matches any protection rule
 * 4. If there is no rule → allows access (NextResponse.next())
 * 5. If there is a rule but the user is not authenticated → denies access
 * 6. If there is a rule with level "admin" and the user is not ADMIN → denies access
 * 7. Otherwise → allows access
 *
 * IMPORTANT: The middleware runs in the Edge Runtime (not Node.js).
 * So Node.js dependencies (fs, path, etc.) cannot be used.
 *
 * @see config/protected-routes.ts - Definition of the protection rules
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { ROUTE_RULES } from "./config/protected-routes";

/**
 * The application's main middleware.
 *
 * Runs for all requests that match the matcher
 * defined in the `config` export.
 *
 * @param req - Next.js request containing URL, cookies, headers, etc.
 * @returns Next.js response (next handler, redirect, or JSON error)
 *
 * @example
 * // Unauthenticated user accessing /profile
 * // Result: redirect to /sign-in?next=/profile
 *
 * @example
 * // CUSTOMER user accessing /api/admin
 * // Result: { error: "Forbidden" } with status 403
 *
 * @example
 * // ADMIN user accessing /dashboard
 * // Result: NextResponse.next() (access granted)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Try to extract and validate the JWT from the cookie
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  // Check whether the current route matches any protection rule
  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));

  // Public route: no rule applies → access granted
  if (!rule) return NextResponse.next();

  // CASE 1: the user is NOT authenticated
  if (!payload) {
    // For API routes: return JSON 401 (Unauthorized)
    if (rule.responseType === "api") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // Expired access (15 min) but with a refresh token: renew and return to
    // this page (ADR-0021). If the renewal fails, the endpoint itself leads to login.
    if (req.cookies.get(REFRESH_COOKIE)?.value) {
      return NextResponse.redirect(
        new URL(
          `/api/auth/refresh?next=${encodeURIComponent(pathname + req.nextUrl.search)}`,
          req.url,
        ),
      );
    }

    // For page routes: redirect to login
    // The next parameter allows redirecting back after a successful login
    return NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  // CASE 2: authenticated user but insufficient access level
  // Rule with level "admin" and the user is not ADMIN
  if (rule.level === "admin" && payload.type !== "ADMIN") {
    // For API routes: return JSON 403 (Forbidden)
    if (rule.responseType === "api") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For page routes: redirect to home (no permission)
    return NextResponse.redirect(new URL("/", req.url));
  }

  // CASE 3: authenticated user WITH adequate permission
  // Access granted to the next handler (API route or page)
  return NextResponse.next();
}

/**
 * Middleware matcher configuration.
 *
 * Defines which routes are processed by the middleware.
 * Important optimization: without this matcher, the middleware would run for
 * ALL requests (including CSS, JS, images, etc.), hurting performance.
 *
 * Supported patterns (glob patterns):
 * - /profile/:path* → all routes starting with /profile
 * - /dashboard/:path* → all routes starting with /dashboard
 * - /api/users/:path+ → /api/users/<id> only (the collection, /api/users, stays reachable for public sign-up)
 * - /api/admin/:path* → all routes starting with /api/admin
 *
 * Why not use ROUTE_RULES to generate the matcher automatically?
 * - The matcher must be static (it cannot depend on runtime variables)
 * - middleware.ts is compiled at build time, ROUTE_RULES is loaded at runtime
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    "/profile/:path*",
    "/ai-scan/:path*",
    "/dashboard/:path*",
    "/api/users/:path+",
    "/api/admin/:path*",
  ],
};
