// app/api/users/[id]/route.ts

/**
 * USER BY ID API ROUTES
 *
 * Endpoints for operations on a specific user.
 *
 * GET /api/users/{id} - Fetch user by ID
 * PUT /api/users/{id} - Update user
 * DELETE /api/users/{id} - Delete user (requires ADMIN)
 *
 * Permission rules:
 * - GET: A user can only see their own profile (or ADMIN sees anyone)
 * - PUT: A user can only edit their own profile (or ADMIN edits anyone)
 * - DELETE: Only ADMIN can delete users
 *
 * @see services/user.service.ts - Business logic
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERRORS, mapError } from "@/lib/http/responses";
import { routeId } from "@/lib/http/params";
import { updateUserSchema } from "@/lib/schemas/user";
import {
  getUser,
  updateUser,
  deleteUser,
} from "@/services/user.service";

/**
 * GET /api/users/{id} - Fetch user by ID
 *
 * Permission: A user can only see their own profile.
 * ADMIN can see any user.
 *
 * @param id - User ID in the URL
 * @returns { user: User }
 * @status 200 - User found
 * @status 401 - Not authenticated
 * @status 403 - Access denied (trying to see another user without being ADMIN)
 * @status 404 - User not found
 * @status 500 - Error fetching user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  const id = await routeId(params);

  if (!session || (session.id !== id && session.type !== "ADMIN")) {
    return ERRORS.forbidden();
  }
  if (id === null) return ERRORS.invalidData("Invalid ID");

  try {
    const user = await getUser(id);
    if (!user) return ERRORS.notFound("User");
    return NextResponse.json({ user });
  } catch (err) {
    return ERRORS.internal("fetch user", err);
  }
}

/**
 * PUT /api/users/{id} - Update user
 *
 * Permission: A user can only edit their own profile.
 * ADMIN can edit any user.
 *
 * @param id - User ID in the URL
 * @body { name?: string, email?: string, phone?: string, password?: string, currentPassword?: string }
 * @returns { user: User }
 * @status 200 - User updated
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 403 - Access denied, or wrong current password when changing your own password
 * @status 404 - User not found
 * @status 409 - Email already registered
 * @status 500 - Error updating user
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  const id = await routeId(params);

  if (!session || (session.id !== id && session.type !== "ADMIN")) {
    return ERRORS.forbidden();
  }
  if (id === null) return ERRORS.invalidData("Invalid ID");

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const user = await updateUser(id, parsed.data, session.id);
    return NextResponse.json({ user });
  } catch (err) {
    return mapError(err, "User") ?? ERRORS.internal("update user", err);
  }
}

/**
 * DELETE /api/users/{id} - Delete user
 *
 * Permission: Only ADMIN can delete users.
 *
 * @param id - User ID in the URL
 * @returns { ok: true }
 * @status 200 - User deleted
 * @status 401 - Not authenticated
 * @status 403 - Access denied (not ADMIN)
 * @status 404 - User not found
 * @status 409 - The ADMIN's own account, or a user with links (e.g. brand)
 * @status 500 - Error deleting user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  if (!session || session.type !== "ADMIN") return ERRORS.forbidden();

  try {
    const id = await routeId(params);
    if (id === null) return ERRORS.invalidData("Invalid ID");
    await deleteUser(id, session.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mapError(err, "User") ?? ERRORS.internal("delete user", err);
  }
}
