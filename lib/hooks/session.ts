// lib/hooks/session.ts

/**
 * Consulta única da sessão no cliente (`GET /api/auth/me`).
 *
 * Antes, `Header`, `ChatFlutuante`, a tela de login e o perfil chamavam
 * `/api/auth/me` cada um por conta própria. Agora:
 * - chamadas SIMULTÂNEAS dividem uma só requisição;
 * - o resultado NÃO é guardado entre chamadas (a sessão pode mudar a qualquer
 *   momento: login, logout, expiração), então não há cache que vaze para outro
 *   usuário;
 * - o logout (`encerrarSessaoNoCliente`) também esvazia o cache de dados do
 *   `useFetch`.
 */

import { clearClientCache } from "./useFetch";

export interface SessionUser {
  id: number;
  nome: string;
  email: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
}

let inProgress: Promise<SessionUser | null> | null = null;

/** @returns o usuário logado, ou `null` se não há sessão (ou se a consulta falhou). */
export function fetchSession(): Promise<SessionUser | null> {
  if (inProgress) return inProgress;

  inProgress = fetch("/api/auth/me", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { usuario?: SessionUser | null };
      return data.usuario ?? null;
    })
    .catch(() => null)
    .finally(() => {
      inProgress = null;
    });

  return inProgress;
}

/** Logout: revoga a sessão no servidor e esvazia o cache de dados do cliente. */
export async function endClientSession(): Promise<void> {
  try {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
  } finally {
    clearClientCache();
  }
}
