// lib/auth/jwt.ts

/**
 * JWT SERVICE
 *
 * Complete JWT (JSON Web Token) authentication implementation.
 *
 * Features:
 * - Tokens signed with HS256 (HMAC-SHA256)
 * - Short-lived ACCESS token (15 min); renewal uses a revocable opaque token (ADR-0021)
 * - httpOnly cookies (safer than localStorage)
 * - Singleton pattern: one instance reused globally
 *
 * Security:
 * - Tokens are signed with JWT_SECRET (environment variable)
 * - httpOnly cookies: not reachable from JavaScript (mitigates XSS)
 * - secure: true in production (sent over HTTPS only)
 * - sameSite: "lax" (protects against CSRF on safe methods)
 *
 * Required environment variable:
 * - JWT_SECRET: secret key used to sign tokens (minimum 32 characters)
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_TOKEN_SECONDS,
  REFRESH_TOKEN_SECONDS,
} from "./constants";
import type {
  JwtPayload,
  TokenIssuer,
  TokenVerifier,
  SessionReader,
} from "@/types/auth";

/**
 * Reads the secret key from the environment and converts it to a Uint8Array.
 *
 * Format expected by the jose library:
 * - TextEncoder().encode() converts a string to UTF-8 bytes
 *
 * @returns Secret key as a Uint8Array
 * @throws Error if JWT_SECRET is not configured
 */
function getSecret(): Uint8Array {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error(
      "[lib/auth] JWT_SECRET is not set. Configure the environment variable.",
    );
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * JWT service implementing the three authentication interfaces.
 *
 * Responsibilities:
 * - sign: create signed tokens
 * - verify: validate tokens and extract the payload
 * - getSession: extract the session from Next.js requests
 * - setAuthCookie: set the authentication cookie on the response
 */
export class JwtService
  implements TokenIssuer, TokenVerifier, SessionReader
{
  /**
   * Generates a new JWT.
   *
   * Algorithm: HS256 (HMAC with SHA-256)
   * Expiration: ACCESS_TOKEN_SECONDS (15 minutes)
   *
   * @param payload - Data to encode in the token
   * @returns Compact JWT (string)
   *
   * @example
   * const token = await jwtService.sign({ id: 1, email: "admin@ecoshop.com", type: "ADMIN" });
   */
  async sign(payload: JwtPayload): Promise<string> {
    return new SignJWT(payload as unknown as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${ACCESS_TOKEN_SECONDS}s`)
      .sign(getSecret());
  }

  /**
   * Validates a JWT and returns the payload.
   *
   * Checks done automatically by jose:
   * - Signature (the token was not tampered with)
   * - Expiration (the token is still valid)
   * - Format (valid JWT structure)
   *
   * Additional checks:
   * - Verifies that the required fields (id, email, type) are present
   *
   * @param token - JWT to validate
   * @returns Decoded payload, or null if invalid
   */
  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const typedPayload = payload as unknown as JwtPayload;

      // Additional validation: required fields must exist
      if (typedPayload.id && typedPayload.email && typedPayload.type) {
        return typedPayload;
      }
      return null;
    } catch {
      // Any error (invalid signature, expired token, malformed)
      return null;
    }
  }

  /**
   * Extracts the user session from the Next.js request.
   *
   * Flow:
   * 1. Reads the "token" cookie from the request
   * 2. If it does not exist → returns null
   * 3. Validates the token with verify()
   * 4. Returns the payload or null
   *
   * Used in:
   * - Middleware (route protection)
   * - API routes (authentication)
   *
   * @param req - Next.js request containing the cookies
   * @returns Authenticated user payload, or null
   */
  async getSession(req: NextRequest): Promise<JwtPayload | null> {
    const token = req.cookies.get(ACCESS_COOKIE)?.value;
    if (!token) return null;
    return this.verify(token);
  }

  /**
   * Extracts the user session from cookies (in Server Components).
   *
   * Alternative to getSession for Next.js Server Components
   * (which have no direct access to the Request object).
   *
   * @returns Authenticated user payload, or null
   */
  async getSessionFromCookies(): Promise<JwtPayload | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(ACCESS_COOKIE)?.value;
      if (!token) return null;
      return this.verify(token);
    } catch {
      return null;
    }
  }

  /**
   * Sets the authentication cookie on the HTTP response.
   *
   * Security settings:
   * - httpOnly: true → not reachable from JavaScript (mitigates XSS)
   * - secure: true in production → sent over HTTPS only
   * - sameSite: "lax" → protects against CSRF on safe methods
   * - maxAge: same as the access token lifetime
   * - path: "/" → cookie available across the whole application
   *
   * @param res - Next.js response
   * @param token - JWT to store
   */
  setAuthCookie(res: NextResponse, token: string): void {
    res.cookies.set(ACCESS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_SECONDS,
      path: "/",
    });
  }

  /**
   * Sets the (opaque) refresh token cookie. Same protections as the access cookie;
   * `path: "/"` because the middleware needs to know it exists in order to
   * renew an expired access token on page navigations (ADR-0021).
   */
  setRefreshCookie(res: NextResponse, token: string): void {
    res.cookies.set(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_SECONDS,
      path: "/",
    });
  }

  /** Removes both session cookies (logout, refresh refused). */
  clearSessionCookies(res: NextResponse): void {
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
  }
}

/**
 * Singleton instance of the JWT service.
 * Reused across the whole application for consistency.
 */
export const jwtService = new JwtService();
