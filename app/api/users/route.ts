// app/api/users/route.ts

/**
 * USERS API ROUTE (collection)
 *
 * GET  /api/users - Lists all users (ADMIN only)
 * POST /api/users - Creates a user. Who is asking decides the flow (ADR-0023):
 *   - ADMIN session: administrative creation. Any type (including ADMIN); the admin's session is
 *     left untouched and no rate limit applies.
 *   - Anyone else (no session or not ADMIN): public registration. Type restricted to CUSTOMER or
 *     BRAND, rate limited by IP, and the new user is signed in.
 *
 * Record-level routes (read, update, delete) are in app/api/users/[id]/route.ts.
 *
 * Public registration flow:
 * 1. Rate limiting by IP (5 attempts/hour)
 * 2. Validation of the registration data
 * 3. The service checks whether the email is already registered
 * 4. Creates the user with a hashed password (bcrypt)
 * 5. Starts the session (access JWT + refresh token) and sets the cookies
 * 6. Returns the user's data (excludes the password)
 *
 * @see services/user.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession, setAuthCookie, setRefreshCookie } from "@/lib/auth";
import { ERRORS, mapError } from "@/lib/http/responses";
import {
  adminRegistrationSchema,
  publicRegistrationSchema,
} from "@/lib/schemas/user";
import { listUsers, createUser } from "@/services/user.service";
import { startSession } from "@/services/session.service";
import { requireAdmin } from "@/app/_middleware/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW = 3600;

/**
 * GET /api/users - List all users
 *
 * Requires ADMIN authentication.
 *
 * @returns { users: User[] }
 * @status 200 - List returned
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 500 - Error listing users
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return ERRORS.internal("list users", err);
  }
}

/**
 * POST /api/users - Create a user (administrative or public registration)
 *
 * @body ADMIN session:    { name, email, phone?, password, type?: "CUSTOMER" | "BRAND" | "ADMIN" }
 * @body Anyone else:      { name, email, phone?, password, type?: "CUSTOMER" | "BRAND", brandName?, brandDescription? }
 * @returns ADMIN session: { user: User }
 * @returns Anyone else:   { ok: true, user: { id, email, name, type }, pendingBrand } + httpOnly cookies
 * @status 201 - User created
 * @status 400 - Invalid data
 * @status 409 - Email already registered
 * @status 429 - Too many attempts (rate limit; public registration only)
 * @status 500 - Internal error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (session?.type === "ADMIN") return await createAsAdmin(req);
    return await register(req);
  } catch (err) {
    return mapError(err, "User") ?? ERRORS.internal("create user", err);
  }
}

/** Administrative creation: any type, no session change, no rate limit. */
async function createAsAdmin(req: NextRequest) {
  const body = await req.json();
  const parsed = adminRegistrationSchema.safeParse(body);
  if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

  const user = await createUser(parsed.data);
  return NextResponse.json({ user }, { status: 201 });
}

/** Public registration: CUSTOMER or BRAND, rate limited, signs the new user in. */
async function register(req: NextRequest) {
  const ip = getClientIp(req);
  const { blocked } = await rateLimit(`${ip}:register`, {
    limit: REGISTRATION_LIMIT,
    windowSeconds: REGISTRATION_WINDOW,
  });

  if (blocked) {
    return NextResponse.json(
      { error: "Too many registration attempts. Wait 1 hour." },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = publicRegistrationSchema.safeParse(body);

  if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

  // Email duplication is decided by the service (BusinessConflict → 409).
  const user = await createUser(parsed.data);

  // createUser already invalidates the users cache.
  const issued = await startSession({
    id: user.id,
    email: user.email,
    type: user.type,
  });

  const res = NextResponse.json(
    {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
      },
      pendingBrand: user.pendingBrand,
    },
    { status: 201 },
  );

  setAuthCookie(res, issued.access);
  if (issued.refresh) setRefreshCookie(res, issued.refresh);
  return res;
}
