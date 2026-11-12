// lib/auth/index.ts

/**
 * AUTH MODULE EXPORTS
 *
 * Single entry point for all authentication features.
 *
 * This module exports:
 * - High-level functions to sign/verify tokens
 * - Functions to get the session (request or cookies)
 * - Function to set the authentication cookie
 * - Related types (JwtPayload)
 *
 * Typical usage in API routes:
 * ```ts
 * import { getSession, signToken, setAuthCookie } from "@/lib/auth";
 *
 * const session = await getSession(req);
 * if (!session) return ERRORS.unauthorized();
 *
 * const token = await signToken({ id: user.id, email, tipo });
 * setAuthCookie(res, token);
 * ```
 *
 * Typical usage in middleware:
 * ```ts
 * import { getSession } from "@/lib/auth";
 *
 * const session = await getSession(req);
 * ```
 */

import type { NextRequest, NextResponse } from "next/server";
import { jwtService } from "./jwt";
import type { JwtPayload } from "@/types/auth";

// Main token functions (jwtService wrappers)
export const signToken = (payload: JwtPayload) => jwtService.sign(payload);
export const verifyToken = (token: string) => jwtService.verify(token);

// Session functions from a request or cookies
export const getSession = (req: NextRequest) => jwtService.getSession(req);
export const getSessionFromCookies = () => jwtService.getSessionFromCookies();

// Function to set the authentication cookie on the response
export const setAuthCookie = (res: NextResponse, token: string) =>
  jwtService.setAuthCookie(res, token);

// Re-exports the JwtPayload type for convenience
export const setRefreshCookie = (res: NextResponse, token: string) =>
  jwtService.setRefreshCookie(res, token);

export const clearSessionCookies = (res: NextResponse) =>
  jwtService.clearSessionCookies(res);

export type { JwtPayload } from "@/types/auth";
