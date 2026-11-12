// lib/http/responses.ts

/**
 * HTTP RESPONSE HELPERS
 *
 * Utility functions to standardize HTTP responses in Next.js API routes.
 *
 * Goals:
 * - Centralize error messages (DRY)
 * - Guarantee consistent HTTP codes
 * - Easier maintenance (change a message in a single place)
 *
 * IMPORTANT: All responses follow the pattern:
 * { error: string } | { error: string, details?: unknown }
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  ResourceNotFound,
  BusinessConflict,
  OperationNotAllowed,
} from "@/lib/errors/domain";
import { log, serializeError } from "@/lib/log";

/**
 * Creates a standard error response.
 *
 * @param {string} message - Descriptive error message
 * @param {number} status - HTTP code (e.g. 400, 401, 404, 500)
 * @returns {NextResponse} JSON response with { error: message }
 */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Predefined error constants for use in API routes.
 *
 * Typical usage in route.ts:
 * ```ts
 * import { ERRORS } from "@/lib/http/responses";
 *
 * export async function GET(req: NextRequest) {
 *   if (!authenticated) return ERRORS.unauthorized();
 *   // ...
 * }
 * ```
 */
export const ERRORS = {
  /**
   * 401 Unauthorized - user not authenticated.
   * Used when the token is missing, invalid or expired.
   */
  unauthorized: () => errorResponse("Not authorized", 401),

  /**
   * 403 Forbidden - authenticated user without permission.
   * Example: a CUSTOMER user trying to access an ADMIN route.
   */
  forbidden: () => errorResponse("Forbidden", 403),

  /**
   * 400 Bad Request - invalid data in the request.
   * Accepts optional details (e.g. Zod validation errors).
   *
   * @param {unknown} details - Optional: extra details (e.g. Zod flatten)
   */
  invalidData: (details?: unknown) =>
    NextResponse.json({ error: "Invalid data", details }, { status: 400 }),

  /**
   * 404 Not Found - resource not found.
   * @param {string} resource - Resource name (e.g. "Product", "User")
   */
  notFound: (resource: string) =>
    errorResponse(`${resource} not found`, 404),

  /**
   * 500 Internal Server Error - unhandled error.
   * @param {string} context - Action being performed (e.g. "fetch user")
   */
  /**
   * 500. Logs the cause (REQ-OPS-19): before, the exception was swallowed and a
   * production 500 left no trace. The response body still has no detail.
   *
   * @param context - What was being attempted (becomes "Failed to <context>")
   * @param cause - The error caught in the `catch`
   */
  internal: (context: string, cause?: unknown) => {
    log.error("internal_error", { context, error: serializeError(cause) });
    return errorResponse(`Failed to ${context}`, 500);
  },

  /**
   * 409 Conflict - conflict with the resource's current state.
   * Example: attempt to create a user with an existing email.
   * @param {string} message - Description of the conflict
   */
  conflict: (message: string) => errorResponse(message, 409),
} as const;

/**
 * Single table that converts a known error into an HTTP response (Constitution,
 * Art. VII): typed domain errors (`ResourceNotFound` → 404,
 * `BusinessConflict` → 409, `OperationNotAllowed` → 403) and Prisma errors by `err.code`.
 *
 * IMPORTANT: never decides from the text of `err.message`. Prisma's message is
 * free text and may contain the substring of another code by coincidence — that is
 * exactly what made a deletion blocked by an FK (P2003) become 404 instead of
 * 409 (REQ-REF-03, D7) and left `PUT` of a nonexistent user as 500.
 *
 * @param err - Error caught in the route's catch
 * @param resource - Resource name for the Prisma error messages (e.g. "Category")
 * @returns The appropriate response, or `null` if the error is not a known one
 *          (the caller should then fall back to `ERRORS.internal(...)`)
 *
 * @example
 * try {
 *   await updateCategory(id, data);
 * } catch (err) {
 *   return mapError(err, "Category") ?? ERRORS.internal("update category", err);
 * }
 */
export function mapError(err: unknown, resource: string): NextResponse | null {
  if (err instanceof ResourceNotFound) {
    return ERRORS.notFound(err.resource);
  }
  if (err instanceof BusinessConflict) {
    return ERRORS.conflict(err.message);
  }
  if (err instanceof OperationNotAllowed) {
    return errorResponse(err.message, 403);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return ERRORS.notFound(resource);
    if (err.code === "P2002")
      return ERRORS.conflict(`A ${resource.toLowerCase()} with this name already exists`);
    if (err.code === "P2003")
      return ERRORS.conflict(
        `${resource} has links and cannot be deleted or changed to a nonexistent reference`,
      );
    return null;
  }

  return null;
}
