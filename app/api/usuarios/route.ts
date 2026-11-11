// app/api/usuarios/route.ts

/**
 * USERS API ROUTES (ADMIN)
 *
 * Administrative endpoints for user management.
 *
 * GET /api/usuarios - List all users (requires ADMIN)
 * POST /api/usuarios - Create a new user (requires ADMIN)
 *
 * Difference from POST /api/users (public):
 * - This one is restricted to ADMIN
 * - Allows creating users of any type (including ADMIN)
 *
 * @see services/user.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS, mapError } from "@/lib/http/responses";
import { adminRegistrationSchema } from "@/lib/schemas/user";
import { listUsers, createUser } from "@/services/user.service";
import { requireAdmin } from "@/app/_middleware/auth";

/**
 * GET /api/usuarios - List all users
 *
 * Requires ADMIN authentication.
 *
 * @returns { usuarios: User[] }
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
    return NextResponse.json({ usuarios: users });
  } catch (err) {
    return ERRORS.internal("list users", err);
  }
}

/**
 * POST /api/usuarios - Create a new user (admin)
 *
 * Requires ADMIN authentication.
 *
 * @body { nome: string, email: string, telefone?: string, senha: string, tipo?: "CLIENTE" | "MARCA" | "ADMIN" }
 * @returns { usuario: User }
 * @status 201 - User created
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Not ADMIN
 * @status 409 - Email already registered
 * @status 500 - Error creating user
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = adminRegistrationSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const user = await createUser(parsed.data);
    return NextResponse.json({ usuario: user }, { status: 201 });
  } catch (err) {
    return mapError(err, "User") ?? ERRORS.internal("create user", err);
  }
}
