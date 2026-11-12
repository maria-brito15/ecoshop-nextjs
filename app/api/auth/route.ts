// app/api/auth/route.ts

/**
 * AUTH API ROUTES - LOGIN AND LOGOUT
 *
 * POST /api/auth - Login
 * DELETE /api/auth - Logout (revokes the refresh token and removes the cookies)
 *
 * Login flow:
 * 1. Rate limiting by IP (10 attempts/minute)
 * 2. Body validation (email + password)
 * 3. `verifyCredentials`: bcrypt ALWAYS runs, with or without an account (REQ-AUTH-23)
 * 4. `startSession`: access JWT (15 min) + refresh token in Redis (ADR-0021)
 * 5. httpOnly cookies `token` and `refresh`
 *
 * Without Redis the login still works: there is just no refresh token (REQ-AUTH-19).
 *
 * @see services/session.service.ts - Session
 * @see lib/rate-limit.ts - Rate limiting
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, setRefreshCookie, clearSessionCookies } from "@/lib/auth";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { ERRORS } from "@/lib/http/responses";
import { loginSchema } from "@/lib/schemas/user";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCredentials } from "@/services/user.service";
import { startSession, endSession } from "@/services/session.service";

const ATTEMPT_LIMIT = 10;
const WINDOW_SECONDS = 60;

/**
 * POST /api/auth - User login
 *
 * @body { email: string, password: string }
 * @returns { ok: true, user: { id, email, type } } + httpOnly cookies
 * @status 200 - Login successful
 * @status 400 - Invalid data (email or password missing)
 * @status 401 - Invalid credentials
 * @status 429 - Too many attempts (rate limit)
 * @status 500 - Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { blocked } = await rateLimit(ip, {
      limit: ATTEMPT_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    });

    if (blocked) {
      return NextResponse.json(
        { error: "Too many attempts. Wait 1 minute and try again." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData();

    const { email, password } = parsed.data;
    const identity = await verifyCredentials(email, password);
    if (!identity) return ERRORS.unauthorized();

    const session = await startSession(identity);

    const res = NextResponse.json({
      ok: true,
      user: {
        id: identity.id,
        email: identity.email,
        type: identity.type,
      },
    });

    setAuthCookie(res, session.access);
    if (session.refresh) setRefreshCookie(res, session.refresh);
    return res;
  } catch (err) {
    return ERRORS.internal("process authentication", err);
  }
}

/**
 * DELETE /api/auth - User logout
 *
 * Revokes the refresh token (REQ-AUTH-20) and removes both cookies.
 *
 * @returns { ok: true }
 * @status 200 - Logout successful
 */
export async function DELETE(req: NextRequest) {
  await endSession(req.cookies.get(REFRESH_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
