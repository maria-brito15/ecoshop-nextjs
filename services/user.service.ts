// services/user.service.ts

/**
 * USER SERVICE
 *
 * Service layer for user CRUD operations.
 *
 * Responsibilities:
 * - Password hashing with bcrypt (12 rounds - security vs performance)
 * - Email uniqueness validation
 * - User cache (me, individual, listing)
 * - Cache invalidation on mutations
 *
 * Security:
 * - Passwords are never returned in API responses
 * - Queries always exclude the "password" field (explicit select)
 * - Hash with bcrypt (SALT_ROUNDS = 12)
 *
 * Cache strategy:
 * - USER (60s) for individual data
 * - The user listing is NOT cached (sensitive data)
 *
 * @see lib/cache/keys.ts - Key generation functions
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  userKey,
  currentUserKey,
  TTL,
} from "@/lib/cache";
import {
  BusinessConflict,
  OperationNotAllowed,
  ResourceNotFound,
} from "@/lib/errors/domain";
import { revokeUserSessions } from "./session.service";
import type { SessionIdentity } from "./session.service";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

/**
 * Number of bcrypt hashing rounds.
 * 12 rounds = ~2^12 iterations = ~4,096 iterations.
 * Trade-off: security (makes brute force harder) vs performance (does not affect UX).
 */
const SALT_ROUNDS = 12;

/**
 * User fields that may leave the server.
 * NEVER include `password` here (Constitution, Art. IV): every user response
 * must use this projection instead of the full Prisma entity.
 */
const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  type: true,
  createdAt: true,
} as const;

interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  type: "CUSTOMER" | "BRAND" | "ADMIN";
  brandName?: string;
  brandDescription?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  /** Required to change your OWN password (REQ-AUTH-21). */
  currentPassword?: string;
}

const isUniquenessViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/**
 * Throws `BusinessConflict` if the email (ignoring case) or the requested brand name
 * already exist. Serves both as a shortcut before writing and to explain
 * a uniqueness violation detected by the database.
 */
async function ensureNoRegistrationConflict(
  userEmail: string,
  brandName?: string,
) {
  const emailInUse = await prisma.user.findFirst({
    where: { email: { equals: userEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (emailInUse) throw new BusinessConflict("Email already registered");

  if (brandName) {
    const brandInUse = await prisma.brand.findUnique({
      where: { name: brandName },
      select: { id: true },
    });
    if (brandInUse) {
      throw new BusinessConflict("A brand with this name already exists");
    }
  }
}

/**
 * Creates a new user in the system.
 *
 * Validations:
 * - Checks whether the email is already registered
 * - Hashes the password with bcrypt
 *
 * REQ-AUTH-11 / ADR-0018: when `type === "BRAND"` and `brandName` is
 * provided (public registration, which requires the name — REQ-AUTH-14), the user
 * is saved as CUSTOMER (CUSTOMER rights while pending) and a
 * `Brand` with `status: "PENDING"` is created in the same transaction; only an
 * ADMIN approving (`approveBrand`) actually grants the BRAND type.
 * Without `brandName` (admin registration, which does not ask for that field), the
 * previous behavior is kept: the requested type is saved directly.
 *
 * REQ-AUTH-15: the email arrives normalized (lowercase) from the schema; the
 * duplicate check ignores case differences to catch legacy accounts. If two
 * simultaneous requests pass the check, the database's unique constraint
 * (P2002) decides, and the result is also 409.
 *
 * @param data - User data
 * @returns Created user (without the password) and, if pending, `pendingBrand: true`
 * @throws BusinessConflict if the email (or the requested brand name) already exists
 */
export async function createUser(data: CreateUserData) {
  const brandRequest = data.type === "BRAND" && !!data.brandName;
  const requestedBrand = brandRequest ? data.brandName : undefined;

  await ensureNoRegistrationConflict(data.email, requestedBrand);

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          type: brandRequest ? "CUSTOMER" : data.type,
        },
        select: PUBLIC_USER_FIELDS,
      });

      if (brandRequest) {
        await tx.brand.create({
          data: {
            name: data.brandName!,
            description: data.brandDescription,
            status: "PENDING",
            userId: created.id,
          },
        });
      }

      return created;
    });
  } catch (err) {
    // Race between two requests: the database refused; explain which value conflicted.
    if (isUniquenessViolation(err)) {
      await ensureNoRegistrationConflict(data.email, requestedBrand);
    }
    throw err;
  }

  await invalidateCache("USERS");
  if (brandRequest) await invalidateCache("BRANDS");

  return { ...user, pendingBrand: brandRequest };
}

/**
 * Lists all users (admin only).
 *
 * Returned fields (password excluded for security):
 * - id, name, email, phone, type, createdAt
 *
 * NOTE: This listing does NOT use the cache because it contains sensitive data.
 *
 * @returns Array of users with public fields
 */
export async function listUsers() {
  return prisma.user.findMany({
    select: PUBLIC_USER_FIELDS,
  });
}

/**
 * Fetches a user by ID.
 *
 * @param id - User ID
 * @returns The user (without the password), or null
 */
export async function getUser(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_FIELDS,
  });
}

/**
 * Updates an existing user.
 *
 * If a password is provided, it is hashed before saving.
 *
 * Cache invalidation:
 * - Removes the user's individual key
 * - Removes the user's "me" key
 * - Removes the user listing (admin)
 *
 * @param id - ID of the user to update
 * @param data - Update data (all optional)
 * @param requesterId - Who is requesting the update (the session); decides whether the current password is required
 * @returns Updated user
 * @throws BusinessConflict if the new email already belongs to another user
 * @throws OperationNotAllowed (403) when changing your own password without the correct current password
 * @throws PrismaClientKnownRequestError P2025 if the user does not exist (the handler maps it to 404)
 */
export async function updateUser(
  id: number,
  data: UpdateUserData,
  requesterId?: number,
) {
  const { currentPassword, ...fields } = data;

  // REQ-AUTH-21: whoever changes their OWN password proves they know it (a hijacked
  // session is not enough to take over the account). An ADMIN changing another user does not need it.
  if (fields.password && requesterId === id) {
    await requireCurrentPassword(id, currentPassword);
  }

  const updateData: Prisma.UserUpdateInput = { ...fields };

  if (fields.password) {
    updateData.password = await bcrypt.hash(fields.password, SALT_ROUNDS);
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: PUBLIC_USER_FIELDS,
    });
  } catch (err) {
    // `email` is the only unique User column that this update changes.
    if (isUniquenessViolation(err)) {
      throw new BusinessConflict("Email already registered");
    }
    throw err;
  }

  // Invalidate multiple cache keys in parallel
  await Promise.all([
    invalidateKey(userKey(id)),
    invalidateKey(currentUserKey(id)),
    invalidateCache("USERS"),
  ]);

  // REQ-AUTH-20: changing the password ends the other sessions (refresh tokens).
  if (fields.password) await revokeUserSessions(id);

  return user;
}

/**
 * Deletes a user.
 * Requires ADMIN authentication.
 *
 * REQ-USR-08: nobody deletes their own account here (avoids being left without an ADMIN).
 *
 * @param id - ID of the user to delete
 * @param requesterId - ID of whoever requests the deletion (the session)
 * @returns true if deleted successfully
 * @throws BusinessConflict if it is the requester's own account
 * @throws ResourceNotFound if the user does not exist
 * @throws PrismaClientKnownRequestError P2003 if it has dependencies (e.g. brand); the handler maps it to 409
 */
export async function deleteUser(id: number, requesterId: number) {
  if (id === requesterId) {
    throw new BusinessConflict("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new ResourceNotFound("User");
  }

  await prisma.user.delete({ where: { id } });
  await revokeUserSessions(id);
  await Promise.all([
    invalidateKey(userKey(id)),
    invalidateKey(currentUserKey(id)),
    invalidateCache("USERS"),
  ]);

  return true;
}

/**
 * Checks the user's current password (REQ-AUTH-21).
 * @throws ResourceNotFound if the user does not exist
 * @throws OperationNotAllowed if the current password is missing or does not match
 */
async function requireCurrentPassword(id: number, currentPassword: string | undefined) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true },
  });
  if (!user) throw new ResourceNotFound("User");
  if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new OperationNotAllowed("Current password is incorrect");
  }
}

/**
 * Hash of a password nobody knows, computed once. It is used to spend the
 * same bcrypt time when the email does not exist (REQ-AUTH-23).
 */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () =>
  (dummyHash ??= bcrypt.hash(
    randomBytes(16).toString("hex"),
    SALT_ROUNDS,
  ));

/**
 * Checks the login email and password.
 *
 * REQ-AUTH-23: always runs the bcrypt comparison, even when the email does not
 * exist, so the response time does not reveal which emails have an account.
 * REQ-AUTH-15: the email is compared ignoring case (legacy accounts).
 *
 * @returns the session identity, or `null` if the credentials do not match
 */
export async function verifyCredentials(
  providedEmail: string,
  password: string,
): Promise<SessionIdentity | null> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: providedEmail, mode: "insensitive" } },
  });
  const hash = user?.password ?? (await getDummyHash());
  const matches = await bcrypt.compare(password, hash);
  if (!user || !matches) return null;
  return { id: user.id, email: user.email, type: user.type };
}

/** Rereads the user's current id, email and role (session refresh); `null` if deleted. */
export async function getIdentity(
  id: number,
): Promise<SessionIdentity | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, type: true },
  });
}

/** "Who am I" data (`/api/auth/me`), with a short cache. */
export async function getSessionProfile(id: number) {
  return withCache(currentUserKey(id), TTL.USER, () =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, type: true },
    }),
  );
}
