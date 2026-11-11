// lib/auth/refresh.ts

/**
 * Refresh tokens (ADR-0021): random, OPAQUE value, stored in Redis only as a
 * SHA-256 hash (a Redis leak does not hand out usable tokens).
 *
 * Redis keys:
 * - `refresh:<hash>`       → user id, with the token's validity;
 * - `refresh_user:<id>`    → set of the user's active hashes (allows revoking
 *                            all sessions at once).
 *
 * `consume` uses GETDEL: read and delete in one operation. Two simultaneous requests
 * with the same token cannot both refresh (single-use rotation).
 *
 * Runs on Node only (uses `node:crypto`); the middleware (edge) does not import this file.
 */

import { createHash, randomBytes } from "node:crypto";
import { redis, withTimeout, COMMAND_TIMEOUT_MS } from "@/lib/redis";
import { REFRESH_TOKEN_SECONDS } from "./constants";

/** Where refresh tokens are kept. Throws if the storage is unavailable. */
export interface RefreshTokenStore {
  create(token: string, userId: number): Promise<void>;
  /** Removes the token and returns its owner; `null` if it does not exist (invalid, expired or already used). */
  consume(token: string): Promise<number | null>;
  /** Removes one token (logout). */
  revoke(token: string): Promise<void>;
  /** Removes all of the user's tokens (password change, deletion). */
  revokeAll(userId: number): Promise<void>;
}

/** 32 random bytes (256 bits) in base64url. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

const hashDoToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const tokenKey = (hash: string) => `refresh:${hash}`;
const refreshUserKey = (userId: number) => `refresh_user:${userId}`;

const withShortTimeout = <T>(promise: Promise<T>) =>
  withTimeout(promise, COMMAND_TIMEOUT_MS);

class RedisRefreshTokenStore implements RefreshTokenStore {
  async create(token: string, userId: number): Promise<void> {
    const hash = hashDoToken(token);
    const set = refreshUserKey(userId);
    await withShortTimeout(
      redis
        .multi()
        .set(tokenKey(hash), String(userId), {
          EX: REFRESH_TOKEN_SECONDS,
        })
        .sAdd(set, hash)
        .expire(set, REFRESH_TOKEN_SECONDS)
        .exec(),
    );
  }

  async consume(token: string): Promise<number | null> {
    const hash = hashDoToken(token);
    const owner = await withShortTimeout(redis.getDel(tokenKey(hash)));
    if (owner === null) return null;

    const userId = Number(owner);
    if (!Number.isInteger(userId)) return null;
    // Set cleanup: if it fails, the hash becomes garbage until the set expires.
    await withShortTimeout(redis.sRem(refreshUserKey(userId), hash)).catch(() => undefined);
    return userId;
  }

  async revoke(token: string): Promise<void> {
    await this.consume(token);
  }

  async revokeAll(userId: number): Promise<void> {
    const set = refreshUserKey(userId);
    const hashes = await withShortTimeout(redis.sMembers(set));
    await withShortTimeout(
      redis.del([...hashes.map(tokenKey), set]),
    );
  }
}

/** Store used by the application (Redis). */
export const refreshTokenStore: RefreshTokenStore = new RedisRefreshTokenStore();
