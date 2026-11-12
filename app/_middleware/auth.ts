// app/_middleware/auth.ts

/**
 * AUTH MIDDLEWARE FOR API ROUTES
 *
 * Authentication and authorization middlewares for use inside API routes.
 *
 * DIFFERENCE FROM THE GLOBAL MIDDLEWARE (middleware.ts):
 * - middleware.ts: runs BEFORE all requests (route level)
 * - This file: runs INSIDE the API routes (handler level)
 *
 * Why separate middlewares?
 * - The global middleware cannot access the request body
 * - Some routes need to validate authentication AFTER processing the body
 * - Allows more granular per-route authentication logic
 *
 * Typical usage in API routes:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const authError = await requireAdmin(req);
 *   if (authError) return authError;
 *
 *   // Route logic here (user is guaranteed to be ADMIN)
 * }
 * ```
 *
 * @see middleware.ts - Global route middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERRORS } from "@/lib/http/responses";

/**
 * Middleware that checks whether the user is authenticated.
 *
 * Useful for routes that require any signed-in user (CUSTOMER, BRAND or ADMIN).
 *
 * @param req - Next.js request
 * @returns null if authenticated, or a NextResponse with a 401 error if not
 *
 * @example
 * // Route that any signed-in user can access
 * export async function GET(req: NextRequest) {
 *   const authError = await requireAuth(req);
 *   if (authError) return authError;
 *
 *   // User is signed in (payload available via getSession)
 *   const session = await getSession(req);
 *   return NextResponse.json({ userId: session.id });
 * }
 */
export async function requireAuth(
  req: NextRequest,
): Promise<NextResponse | null> {
  const session = await getSession(req);

  if (!session) {
    return ERRORS.unauthorized();
  }

  return null;
}

/**
 * Middleware that checks whether the user is ADMIN.
 *
 * Useful for administrative routes (product CRUD, categories, etc.).
 *
 * @param req - Next.js request
 * @returns null if ADMIN, or a NextResponse with an error:
 *          - 401 if not authenticated
 *          - 403 if authenticated but not ADMIN
 *
 * @example
 * // Route that only ADMIN can access
 * export async function POST(req: NextRequest) {
 *   const authError = await requireAdmin(req);
 *   if (authError) return authError;
 *
 *   // User is guaranteed to be ADMIN
 *   const session = await getSession(req);
 *   console.log(`Admin ${session.email} is creating a product`);
 *
 *   // Creation logic...
 * }
 */
export async function requireAdmin(
  req: NextRequest,
): Promise<NextResponse | null> {
  const session = await getSession(req);

  if (!session) {
    return ERRORS.unauthorized();
  }

  if (session.type !== "ADMIN") {
    return ERRORS.forbidden();
  }

  return null;
}
