// types/auth.ts

/**
 * AUTHENTICATION TYPES
 *
 * This file contains the types related to EcoShop's authentication and
 * authorization. It uses JWT (JSON Web Tokens) to manage stateless
 * sessions with httpOnly cookies.
 *
 * The types follow the interface segregation principle (ISP):
 * each interface represents a single responsibility of the auth system.
 */

/**
 * Payload stored in the JWT.
 * This is the data that is encoded in the token and verified on every request.
 *
 * ATTENTION: Do not include sensitive or bulky data in the payload,
 * because the token is transmitted on every HTTP request.
 *
 * The access token is configured to expire in 15 minutes (ADR-0021).
 */
export interface JwtPayload {
  /** Unique user ID in the database (auto-increment primary key) */
  id: number;
  /** User email (unique) — used to identify and display in the frontend */
  email: string;
  /**
   * User type/permission.
   * Decisive for the authorization middleware:
   * - ADMIN → access granted to /api/admin and /dashboard routes
   * - BRAND → access restricted to their own products
   * - CUSTOMER → access only to public routes and the profile
   */
  type: "CUSTOMER" | "BRAND" | "ADMIN";
}

/**
 * Contract for issuing (signing) JWTs.
 * Implemented by JwtService in lib/auth/jwt.ts
 */
export interface TokenIssuer {
  /**
   * Generates a new JWT signed with the secret key.
   * @param payload - Data to encode in the token (id, email, type)
   * @returns Promise with the token string in compact JWT format
   * @throws Error if JWT_SECRET is not configured
   */
  sign(payload: JwtPayload): Promise<string>;
}

/**
 * Contract for verifying JWTs.
 * Implemented by JwtService in lib/auth/jwt.ts
 */
export interface TokenVerifier {
  /**
   * Verifies the validity and signature of a JWT.
   * @param token - JWT to verify
   * @returns Decoded payload if the token is valid, null otherwise
   *
   * Failure reasons:
   * - Expired token (default expiration: 15 minutes)
   * - Invalid signature (tampered token)
   * - Malformed token
   * - Wrong secret key
   */
  verify(token: string): Promise<JwtPayload | null>;
}

/**
 * Contract for reading the session from the Next.js request.
 * Used by middlewares and API routes that need the authenticated user.
 */
export interface SessionReader {
  /**
   * Extracts the token from the request's 'token' cookie and validates it.
   * @param req - App Router NextRequest object containing the cookies
   * @returns Authenticated user's payload, or null if:
   *          - The cookie does not exist
   *          - The token is invalid
   *          - The token is expired
   *
   * @example
   * const session = await getSession(req);
   * if (!session) return ERRORS.unauthorized();
   * console.log(`User ${session.email} is authenticated`);
   */
  getSession(
    req: import("next/server").NextRequest,
  ): Promise<JwtPayload | null>;
}
