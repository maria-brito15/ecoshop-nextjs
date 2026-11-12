// services/session.service.ts

/**
 * SESSION: SHORT-LIVED ACCESS + REVOCABLE REFRESH (ADR-0021)
 *
 * - Login issues an access JWT (15 min) and an opaque refresh token in Redis.
 * - Refreshing SPENDS the token (single use) and issues a new pair, rereading the
 *   user's role from the database: a role change takes effect within 15 min at most.
 * - Without Redis (owner's decision, 2026-11-11): refresh is DENIED and the user
 *   signs in again; login keeps working, just without a refresh token.
 * - Logout, password change and user deletion revoke the refresh tokens.
 *   An access token already issued is valid until it expires (15 min at most): the JWT is
 *   verified without querying Redis.
 *
 * It does not know `Request`/`Response`: it returns the tokens and the handler deals with cookies.
 */

import { signToken } from "@/lib/auth";
import {
  refreshTokenStore,
  generateRefreshToken,
  type RefreshTokenStore,
} from "@/lib/auth/refresh";
import { log, serializeError } from "@/lib/log";
import type { JwtPayload } from "@/types/auth";

/** Who the session represents (same content as the JWT). */
export type SessionIdentity = JwtPayload;

export interface IssuedSession {
  /** JWT de acesso. */
  access: string;
  /** Refresh token, or `null` if Redis was unavailable (access-only session). */
  refresh: string | null;
}

export type RefreshResult =
  | { ok: true; session: IssuedSession; tipo: SessionIdentity["tipo"] }
  | { ok: false; reason: "NO_TOKEN" | "INVALID" | "UNAVAILABLE" };

/** Opens a session: always issues the access token; the refresh token depends on Redis. */
export async function startSession(
  identity: SessionIdentity,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<IssuedSession> {
  const access = await signToken({
    id: identity.id,
    email: identity.email,
    tipo: identity.tipo,
  });

  let refresh: string | null = null;
  try {
    const token = generateRefreshToken();
    await store.create(token, identity.id);
    refresh = token;
  } catch (err) {
    log.warn("session.refresh_unavailable", { error: serializeError(err) });
  }
  return { access: access, refresh: refresh };
}

/**
 * Exchanges a refresh token for a new session.
 *
 * @param getIdentity - Rereads the user from the database (`null` if deleted)
 */
export async function refreshSession(
  refreshToken: string | undefined,
  getIdentity: (userId: number) => Promise<SessionIdentity | null>,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<RefreshResult> {
  if (!refreshToken) return { ok: false, reason: "NO_TOKEN" };

  let userId: number | null;
  try {
    userId = await store.consume(refreshToken);
  } catch (err) {
    log.warn("session.refresh_denied_redis_unavailable", { error: serializeError(err) });
    return { ok: false, reason: "UNAVAILABLE" };
  }
  if (userId === null) return { ok: false, reason: "INVALID" };

  const identity = await getIdentity(userId);
  if (!identity) return { ok: false, reason: "INVALID" };

  const session = await startSession(identity, store);
  return { ok: true, session: session, tipo: identity.tipo };
}

/** Logout: revokes the refresh token (if any). Never throws. */
export async function endSession(
  refreshToken: string | undefined,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<void> {
  if (!refreshToken) return;
  try {
    await store.revoke(refreshToken);
  } catch (err) {
    log.warn("session.revoke_failed", { error: serializeError(err) });
  }
}

/**
 * Revokes all of a user's refresh tokens (password change, deletion). Never throws:
 * if Redis is down, the token stays unusable while it is down
 * (refresh is denied), but it becomes valid again if Redis comes back with the data ❔.
 */
export async function revokeUserSessions(
  userId: number,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<void> {
  try {
    await store.revokeAll(userId);
  } catch (err) {
    log.warn("session.revoke_all_failed", { userId, error: serializeError(err) });
  }
}
