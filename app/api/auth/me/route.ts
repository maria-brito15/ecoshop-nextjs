// app/api/auth/me/route.ts

/**
 * AUTH ME API ROUTE - CURRENT USER
 *
 * Endpoint to get the data of the currently authenticated user.
 *
 * GET /api/auth/me - Returns the current session user's data
 *
 * Flow:
 * 1. Extracts the session from the cookie via getSession()
 * 2. If not authenticated → returns 401 with { user: null }
 * 3. Fetches the user from the database (with a Redis cache)
 * 4. Returns the user's public data (excludes the password)
 *
 * Cache: 1 minute (TTL.USER)
 * Key: "users:me:{id}"
 *
 * Usage in the frontend:
 * ```ts
 * const { data } = useFetch<AuthMeResponse>("/api/auth/me");
 * if (data?.user) {
 *   // User is signed in
 * }
 * ```
 *
 * @see lib/auth/jwt.ts - getSession()
 * @see lib/cache - withCache()
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERRORS } from "@/lib/http/responses";
import { getSessionProfile } from "@/services/user.service";

/**
 * GET /api/auth/me - Gets the current user
 *
 * @returns { user: UserSummary | null }
 * @status 200 - Always returns 200 with user: null if not authenticated
 * @status 401 - Returned when not authenticated (but with the body { user: null })
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = await getSessionProfile(session.id);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    return ERRORS.internal("fetch the session user", err);
  }
}
