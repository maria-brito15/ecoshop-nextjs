// lib/hooks/session.ts

/**
 * Single client-side session query (`GET /api/auth/me`).
 *
 * Before, `Header`, `FloatingChat`, the login page and the profile each called
 * `/api/auth/me` on their own. Now:
 * - SIMULTANEOUS calls share a single request;
 * - the result is NOT kept between calls (the session can change at any
 *   moment: login, logout, expiration), so no cache can leak to another user;
 * - logout (`endClientSession`) also empties the `useFetch` data cache.
 */

import { clearClientCache } from "./useFetch";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  type: "CUSTOMER" | "BRAND" | "ADMIN";
}

let inProgress: Promise<SessionUser | null> | null = null;

/** @returns the signed-in user, or `null` if there is no session (or if the query failed). */
export function fetchSession(): Promise<SessionUser | null> {
  if (inProgress) return inProgress;

  inProgress = fetch("/api/auth/me", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { user?: SessionUser | null };
      return data.user ?? null;
    })
    .catch(() => null)
    .finally(() => {
      inProgress = null;
    });

  return inProgress;
}

/** Logout: revokes the session on the server and empties the client data cache. */
export async function endClientSession(): Promise<void> {
  try {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
  } finally {
    clearClientCache();
  }
}
