// app/api/users/route.ts

/**
 * USERS API ROUTE - PUBLIC REGISTRATION
 *
 * Endpoint for public registration of new users.
 *
 * POST /api/users - Creates a new user account (public)
 *
 * Difference from POST /api/usuarios (admin):
 * - This one is public (anyone can create an account)
 * - The user type is restricted to CLIENTE or MARCA (not ADMIN)
 *
 * Flow:
 * 1. Rate limiting by IP (5 attempts/hour)
 * 2. Validation of the registration data
 * 3. The service checks whether the email is already registered
 * 4. Creates the user with a hashed password (bcrypt)
 * 5. Starts the session (access JWT + refresh token) and sets the cookies
 * 6. Returns the user's data (excludes the password)
 *
 * @see services/user.service.ts - createUser()
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, setRefreshCookie } from "@/lib/auth";
import { ERRORS, mapError } from "@/lib/http/responses";
import { publicRegistrationSchema } from "@/lib/schemas/user";
import { createUser } from "@/services/user.service";
import { startSession } from "@/services/session.service";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW = 3600;

/**
 * POST /api/users - Public user registration
 *
 * @body { nome: string, email: string, telefone?: string, senha: string }
 * @returns { ok: true, usuario: { id, email, nome, tipo } } + httpOnly cookies
 * @status 201 - User created successfully
 * @status 400 - Invalid data
 * @status 409 - Email already registered
 * @status 429 - Too many attempts (rate limit)
 * @status 500 - Internal error
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { blocked: blocked } = await rateLimit(`${ip}:register`, {
      limit: REGISTRATION_LIMIT,
      windowSeconds: REGISTRATION_WINDOW,
    });

    if (blocked) {
      return NextResponse.json(
        { erro: "Too many registration attempts. Wait 1 hour." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = publicRegistrationSchema.safeParse(body);

    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const { nome: name, email, telefone: phone, senha: password, tipo: type, marcaNome: brandName, marcaDescricao: brandDescription } =
      parsed.data;

    // Email duplication is decided by the service (BusinessConflict → 409).
    const user = await createUser({
      nome: name,
      email,
      telefone: phone,
      senha: password,
      tipo: type,
      marcaNome: brandName,
      marcaDescricao: brandDescription,
    });

    // createUser already invalidates the users cache.
    const session = await startSession({
      id: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    const res = NextResponse.json(
      {
        ok: true,
        usuario: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          tipo: user.tipo,
        },
        marcaPendente: user.marcaPendente,
      },
      { status: 201 },
    );

    setAuthCookie(res, session.access);
    if (session.refresh) setRefreshCookie(res, session.refresh);
    return res;
  } catch (err) {
    return mapError(err, "User") ?? ERRORS.internal("register user", err);
  }
}
