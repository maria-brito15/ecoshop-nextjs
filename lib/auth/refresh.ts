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
import { redis, withTimeout, COMMAND_TIMEOUT_MS } from "@/lib/redis";
import { REFRESH_TOKEN_SECONDS } from "./constants";

/** Onde os tokens de renovação ficam. Lança se o armazenamento está indisponível. */
export interface RefreshTokenStore {
  create(token: string, userId: number): Promise<void>;
  /** Remove o token e devolve o dono; `null` se não existe (inválido, expirado ou já usado). */
  consume(token: string): Promise<number | null>;
  /** Remove um token (logout). */
  revoke(token: string): Promise<void>;
  /** Remove todos os tokens do usuário (troca de senha, exclusão). */
  revokeAll(userId: number): Promise<void>;
}

/** 32 bytes aleatórios (256 bits) em base64url. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

const hashDoToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const tokenKey = (hash: string) => `refresh:${hash}`;
const refreshUserKey = (userId: number) => `refresh_usuario:${userId}`;

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
    // Limpeza do conjunto: se falhar, o hash vira lixo até o conjunto expirar.
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

/** Armazém usado pela aplicação (Redis). */
export const refreshTokenStore: RefreshTokenStore = new RedisRefreshTokenStore();
