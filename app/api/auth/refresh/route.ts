// app/api/auth/refresh/route.ts

/**
 * AUTH REFRESH API ROUTE - SESSION RENEWAL (ADR-0021)
 *
 * POST /api/auth/refresh        - Renews the session (used by the front end; JSON)
 * GET  /api/auth/refresh?next=  - Renews and REDIRECTS (used by the middleware
 *                                 when a page navigation arrives with an
 *                                 expired access token and a still-valid refresh token)
 *
 * With the `refresh` cookie (REQ-AUTH-19):
 * - the token is SPENT (single use) and a new pair is issued, with the role reread from the database;
 * - invalid, expired, already-used token or one from a deleted user → 401 and cookies removed;
 * - Redis unavailable → 503 (refresh is denied; the user signs in again).
 *
 * Without the `refresh` cookie (sessions from before ADR-0021, or opened without Redis):
 * keeps the old behavior — with a valid access token, reissues the JWT if the user's
 * role changed in the database.
 *
 * @see services/session.service.ts
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  signToken,
  setAuthCookie,
  setRefreshCookie,
  clearSessionCookies,
} from "@/lib/auth";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { invalidateKey, currentUserKey } from "@/lib/cache";
import { ERRORS } from "@/lib/http/responses";
import { localPathOrRoot } from "@/lib/http/next-url";
import { getIdentity } from "@/services/user.service";
import { refreshSession, type IssuedSession } from "@/services/session.service";

/** Cookies of the completed renewal. */
function applySession(
  res: NextResponse,
  session: IssuedSession,
) {
  setAuthCookie(res, session.access);
  if (session.refresh) setRefreshCookie(res, session.refresh);
}

/**
 * POST /api/auth/refresh
 *
 * @returns { ok: true, type }
 * @status 200 - Session renewed (or still valid, in old mode)
 * @status 401 - No session, or invalid refresh
 * @status 404 - Session user no longer exists (old mode)
 * @status 503 - Refresh unavailable (Redis down)
 */
export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

    if (refreshToken) {
      const r = await refreshSession(refreshToken, getIdentity);
      if (!r.ok) {
        const res =
          r.reason === "UNAVAILABLE"
            ? NextResponse.json(
                { error: "Could not renew the session right now. Please sign in again." },
                { status: 503 },
              )
            : ERRORS.unauthorized();
        clearSessionCookies(res);
        return res;
      }
      const res = NextResponse.json({ ok: true, type: r.type });
      applySession(res, r.session);
      return res;
    }

    // Old mode: no refresh token.
    const session = await getSession(req);
    if (!session) return ERRORS.unauthorized();

    const user = await getIdentity(session.id);
    if (!user) return ERRORS.notFound("User");

    if (user.type !== session.type) {
      const newToken = await signToken(user);
      const res = NextResponse.json({ ok: true, type: user.type });
      setAuthCookie(res, newToken);
      await invalidateKey(currentUserKey(user.id));
      return res;
    }
    return NextResponse.json({ ok: true, type: user.type });
  } catch (err) {
    return ERRORS.internal("renew session", err);
  }
}

/**
 * GET /api/auth/refresh?next=/path
 *
 * Renews and redirects to `next` (local path only; REQ-AUTH-17). If the renewal
 * fails, removes the cookies and goes to login, with `next` preserved.
 */
export async function GET(req: NextRequest) {
  const destination = localPathOrRoot(req.nextUrl.searchParams.get("next"));
  const toLogin = () => {
    const res = NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(destination)}`, req.url),
    );
    clearSessionCookies(res);
    return res;
  };

  try {
    const r = await refreshSession(
      req.cookies.get(REFRESH_COOKIE)?.value,
      getIdentity,
    );
    if (!r.ok) return toLogin();

    const res = NextResponse.redirect(new URL(destination, req.url));
    applySession(res, r.session);
    return res;
  } catch {
    return toLogin();
  }
}
