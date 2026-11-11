// lib/hooks/sessao.ts

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

import { limparCacheCliente } from "./useFetch";

export interface UsuarioDaSessao {
  id: number;
  nome: string;
  email: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
}

let emAndamento: Promise<UsuarioDaSessao | null> | null = null;

/** @returns o usuário logado, ou `null` se não há sessão (ou se a consulta falhou). */
export function buscarSessao(): Promise<UsuarioDaSessao | null> {
  if (emAndamento) return emAndamento;

  emAndamento = fetch("/api/auth/me", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      const dados = (await res.json()) as { usuario?: UsuarioDaSessao | null };
      return dados.usuario ?? null;
    })
    .catch(() => null)
    .finally(() => {
      emAndamento = null;
    });

  return emAndamento;
}

/** Logout: revoga a sessão no servidor e esvazia o cache de dados do cliente. */
export async function encerrarSessaoNoCliente(): Promise<void> {
  try {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
  } finally {
    limparCacheCliente();
  }
}
