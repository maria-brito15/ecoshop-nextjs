// services/session.service.ts

/**
 * ============================================================================
 * SESSÃO: ACESSO CURTO + RENOVAÇÃO REVOGÁVEL (ADR-0021)
 * ============================================================================
 * - Login emite um JWT de acesso (15 min) e um token de renovação opaco no Redis.
 * - Renovar GASTA o token (uso único) e emite um par novo, relendo o papel do
 *   usuário no banco: mudança de papel chega em no máximo 15 min.
 * - Sem Redis (decisão do dono, 2026-11-11): a renovação é NEGADA e o usuário
 *   entra de novo; o login continua funcionando, só sem token de renovação.
 * - Logout, troca de senha e exclusão de usuário revogam os tokens de renovação.
 *   Um acesso já emitido vale até expirar (no máximo 15 min): o JWT é verificado
 *   sem consultar o Redis.
 *
 * Não conhece `Request`/`Response`: devolve os tokens e o handler cuida dos cookies.
 * ============================================================================
 */

import { signToken } from "@/lib/auth";
import {
  refreshTokenStore,
  generateRefreshToken,
  type RefreshTokenStore,
} from "@/lib/auth/refresh";
import { log, serializeError } from "@/lib/log";
import type { JwtPayload } from "@/types/auth";

/** Quem a sessão representa (o mesmo conteúdo do JWT). */
export type SessionIdentity = JwtPayload;

export interface IssuedSession {
  /** JWT de acesso. */
  access: string;
  /** Token de renovação, ou `null` se o Redis estava indisponível (sessão só de acesso). */
  refresh: string | null;
}

export type RefreshResult =
  | { ok: true; session: IssuedSession; tipo: SessionIdentity["tipo"] }
  | { ok: false; reason: "SEM_TOKEN" | "INVALIDO" | "INDISPONIVEL" };

/** Abre uma sessão: sempre emite o acesso; a renovação depende do Redis. */
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
    log.warn("sessao.renovacao_indisponivel", { erro: serializeError(err) });
  }
  return { access: access, refresh: refresh };
}

/**
 * Troca um token de renovação por uma sessão nova.
 *
 * @param getIdentity - Relê o usuário no banco (`null` se foi excluído)
 */
export async function refreshSession(
  refreshToken: string | undefined,
  getIdentity: (userId: number) => Promise<SessionIdentity | null>,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<RefreshResult> {
  if (!refreshToken) return { ok: false, reason: "SEM_TOKEN" };

  let userId: number | null;
  try {
    userId = await store.consume(refreshToken);
  } catch (err) {
    log.warn("sessao.renovacao_negada_redis_indisponivel", { erro: serializeError(err) });
    return { ok: false, reason: "INDISPONIVEL" };
  }
  if (userId === null) return { ok: false, reason: "INVALIDO" };

  const identity = await getIdentity(userId);
  if (!identity) return { ok: false, reason: "INVALIDO" };

  const session = await startSession(identity, store);
  return { ok: true, session: session, tipo: identity.tipo };
}

/** Logout: revoga o token de renovação (se houver). Nunca lança. */
export async function endSession(
  refreshToken: string | undefined,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<void> {
  if (!refreshToken) return;
  try {
    await store.revoke(refreshToken);
  } catch (err) {
    log.warn("sessao.revogacao_falhou", { erro: serializeError(err) });
  }
}

/**
 * Revoga todas as renovações de um usuário (troca de senha, exclusão). Nunca lança:
 * se o Redis estiver fora, o token continua inutilizável enquanto ele estiver fora
 * (a renovação é negada), mas volta a valer se o Redis voltar com os dados ❔.
 */
export async function revokeUserSessions(
  userId: number,
  store: RefreshTokenStore = refreshTokenStore,
): Promise<void> {
  try {
    await store.revokeAll(userId);
  } catch (err) {
    log.warn("sessao.revogacao_total_falhou", { usuarioId: userId, erro: serializeError(err) });
  }
}
