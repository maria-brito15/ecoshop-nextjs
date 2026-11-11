// lib/auth/refresh.ts

/**
 * Tokens de renovação (ADR-0021): valor aleatório e OPACO, guardado no Redis só
 * como hash SHA-256 (um vazamento do Redis não entrega tokens utilizáveis).
 *
 * Chaves no Redis:
 * - `refresh:<hash>`           → id do usuário, com a validade do token;
 * - `refresh_usuario:<id>`     → conjunto dos hashes ativos do usuário (permite
 *                                revogar todas as sessões de uma vez).
 *
 * `consumir` usa GETDEL: ler e apagar numa operação só. Dois pedidos simultâneos
 * com o mesmo token não conseguem ambos renovar (rotação com uso único).
 *
 * Só roda em Node (usa `node:crypto`); o middleware (edge) não importa este arquivo.
 */

import { createHash, randomBytes } from "node:crypto";
import { redis, comPrazo, TIMEOUT_COMANDO_MS } from "@/lib/redis";
import { TEMPO_DA_RENOVACAO_SEGUNDOS } from "./constantes";

/** Onde os tokens de renovação ficam. Lança se o armazenamento está indisponível. */
export interface ArmazemDeRenovacao {
  criar(token: string, usuarioId: number): Promise<void>;
  /** Remove o token e devolve o dono; `null` se não existe (inválido, expirado ou já usado). */
  consumir(token: string): Promise<number | null>;
  /** Remove um token (logout). */
  revogar(token: string): Promise<void>;
  /** Remove todos os tokens do usuário (troca de senha, exclusão). */
  revogarTodos(usuarioId: number): Promise<void>;
}

/** 32 bytes aleatórios (256 bits) em base64url. */
export function gerarTokenDeRenovacao(): string {
  return randomBytes(32).toString("base64url");
}

const hashDoToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const chaveDoToken = (hash: string) => `refresh:${hash}`;
const chaveDoUsuario = (usuarioId: number) => `refresh_usuario:${usuarioId}`;

const comPrazoCurto = <T>(promessa: Promise<T>) =>
  comPrazo(promessa, TIMEOUT_COMANDO_MS);

class ArmazemRedis implements ArmazemDeRenovacao {
  async criar(token: string, usuarioId: number): Promise<void> {
    const hash = hashDoToken(token);
    const conjunto = chaveDoUsuario(usuarioId);
    await comPrazoCurto(
      redis
        .multi()
        .set(chaveDoToken(hash), String(usuarioId), {
          EX: TEMPO_DA_RENOVACAO_SEGUNDOS,
        })
        .sAdd(conjunto, hash)
        .expire(conjunto, TEMPO_DA_RENOVACAO_SEGUNDOS)
        .exec(),
    );
  }

  async consumir(token: string): Promise<number | null> {
    const hash = hashDoToken(token);
    const dono = await comPrazoCurto(redis.getDel(chaveDoToken(hash)));
    if (dono === null) return null;

    const usuarioId = Number(dono);
    if (!Number.isInteger(usuarioId)) return null;
    // Limpeza do conjunto: se falhar, o hash vira lixo até o conjunto expirar.
    await comPrazoCurto(redis.sRem(chaveDoUsuario(usuarioId), hash)).catch(() => undefined);
    return usuarioId;
  }

  async revogar(token: string): Promise<void> {
    await this.consumir(token);
  }

  async revogarTodos(usuarioId: number): Promise<void> {
    const conjunto = chaveDoUsuario(usuarioId);
    const hashes = await comPrazoCurto(redis.sMembers(conjunto));
    await comPrazoCurto(
      redis.del([...hashes.map(chaveDoToken), conjunto]),
    );
  }
}

/** Armazém usado pela aplicação (Redis). */
export const armazemDeRenovacao: ArmazemDeRenovacao = new ArmazemRedis();
