// services/sessao.service.ts

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
  armazemDeRenovacao,
  gerarTokenDeRenovacao,
  type ArmazemDeRenovacao,
} from "@/lib/auth/refresh";
import { log, serializarErro } from "@/lib/log";
import type { JwtPayload } from "@/types/auth";

/** Quem a sessão representa (o mesmo conteúdo do JWT). */
export type IdentidadeDaSessao = JwtPayload;

export interface SessaoEmitida {
  /** JWT de acesso. */
  acesso: string;
  /** Token de renovação, ou `null` se o Redis estava indisponível (sessão só de acesso). */
  renovacao: string | null;
}

export type ResultadoDaRenovacao =
  | { ok: true; sessao: SessaoEmitida; tipo: IdentidadeDaSessao["tipo"] }
  | { ok: false; motivo: "SEM_TOKEN" | "INVALIDO" | "INDISPONIVEL" };

/** Abre uma sessão: sempre emite o acesso; a renovação depende do Redis. */
export async function iniciarSessao(
  identidade: IdentidadeDaSessao,
  armazem: ArmazemDeRenovacao = armazemDeRenovacao,
): Promise<SessaoEmitida> {
  const acesso = await signToken({
    id: identidade.id,
    email: identidade.email,
    tipo: identidade.tipo,
  });

  let renovacao: string | null = null;
  try {
    const token = gerarTokenDeRenovacao();
    await armazem.criar(token, identidade.id);
    renovacao = token;
  } catch (err) {
    log.warn("sessao.renovacao_indisponivel", { erro: serializarErro(err) });
  }
  return { acesso, renovacao };
}

/**
 * Troca um token de renovação por uma sessão nova.
 *
 * @param buscarIdentidade - Relê o usuário no banco (`null` se foi excluído)
 */
export async function renovarSessao(
  tokenDeRenovacao: string | undefined,
  buscarIdentidade: (usuarioId: number) => Promise<IdentidadeDaSessao | null>,
  armazem: ArmazemDeRenovacao = armazemDeRenovacao,
): Promise<ResultadoDaRenovacao> {
  if (!tokenDeRenovacao) return { ok: false, motivo: "SEM_TOKEN" };

  let usuarioId: number | null;
  try {
    usuarioId = await armazem.consumir(tokenDeRenovacao);
  } catch (err) {
    log.warn("sessao.renovacao_negada_redis_indisponivel", { erro: serializarErro(err) });
    return { ok: false, motivo: "INDISPONIVEL" };
  }
  if (usuarioId === null) return { ok: false, motivo: "INVALIDO" };

  const identidade = await buscarIdentidade(usuarioId);
  if (!identidade) return { ok: false, motivo: "INVALIDO" };

  const sessao = await iniciarSessao(identidade, armazem);
  return { ok: true, sessao, tipo: identidade.tipo };
}

/** Logout: revoga o token de renovação (se houver). Nunca lança. */
export async function encerrarSessao(
  tokenDeRenovacao: string | undefined,
  armazem: ArmazemDeRenovacao = armazemDeRenovacao,
): Promise<void> {
  if (!tokenDeRenovacao) return;
  try {
    await armazem.revogar(tokenDeRenovacao);
  } catch (err) {
    log.warn("sessao.revogacao_falhou", { erro: serializarErro(err) });
  }
}

/**
 * Revoga todas as renovações de um usuário (troca de senha, exclusão). Nunca lança:
 * se o Redis estiver fora, o token continua inutilizável enquanto ele estiver fora
 * (a renovação é negada), mas volta a valer se o Redis voltar com os dados ❔.
 */
export async function revogarSessoesDoUsuario(
  usuarioId: number,
  armazem: ArmazemDeRenovacao = armazemDeRenovacao,
): Promise<void> {
  try {
    await armazem.revogarTodos(usuarioId);
  } catch (err) {
    log.warn("sessao.revogacao_total_falhou", { usuarioId, erro: serializarErro(err) });
  }
}
