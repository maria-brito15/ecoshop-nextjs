// lib/redis.ts

/**
 * ============================================================================
 * REDIS CLIENT
 * ============================================================================
 * Este módulo gerencia a conexão com Redis para cache distribuído e rate limiting.
 *
 * Redis é usado para:
 * - Cache de dados (respostas de API)
 * - Rate limiting (contagem de tentativas de login/registro)
 * - Invalidar padrões de chaves (delPattern)
 *
 * Singleton pattern para reutilizar a conexão entre hot reloads em desenvolvimento.
 *
 * IMPORTANTE: Redis é opcional para funcionamento básico da aplicação.
 * Se Redis falhar, a aplicação:
 * - Continua funcionando (fallback sem cache)
 * - Rate limiting é ignorado (permite requisições)
 * - Logs de erro são gerados para monitoramento
 * ============================================================================
 */

import { createClient, RedisClientType } from "redis";

/**
 * Referência global para o singleton do RedisClient.
 * Usa globalThis para persistir entre hot reloads em desenvolvimento.
 */
const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
};

/**
 * Cria e configura um novo cliente Redis.
 *
 * Configurações:
 * - URL via variável de ambiente REDIS_URL (padrão: redis://localhost:6379)
 * - Evento 'error': loga erro mas não derruba a aplicação
 * - Conexão automática: client.connect() é chamado imediatamente
 *
 * @returns {RedisClientType} Cliente Redis configurado
 */
function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = createClient({ url }) as RedisClientType;

  // Event listener para erros de conexão.
  // Não throw error aqui para não derrubar a aplicação se Redis estiver offline.
  client.on("error", (err) => {
    console.warn("[redis] erro de conexão:", err.message);
  });

  // Inicia a conexão (não blocking, Promise é ignorada).
  // Se falhar, o evento 'error' será disparado.
  client.connect().catch((err) => {
    console.warn("[redis] falha ao conectar:", err.message);
  });

  return client;
}

/**
 * Instância singleton do cliente Redis.
 * Reutiliza conexão existente entre requisições.
 */
export const redis = globalForRedis.redis ?? createRedisClient();

// Em desenvolvimento, salva a referência para reutilização.
if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Recupera um valor do Redis e faz parse automático do JSON.
 *
 * @template T - Tipo esperado do valor armazenado
 * @param {string} chave - Chave no Redis
 * @returns {Promise<T | null>} Valor parseado ou null se não existir/erro
 *
 * @example
 * const usuario = await redisGet<Usuario>("usuario:1");
 */
export async function redisGet<T>(chave: string): Promise<T | null> {
  try {
    const raw = await redis.get(chave);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Silencia erro: se o parse falhar (JSON inválido), retorna null.
    // Isso permite que a aplicação continue funcionando sem cache.
    return null;
  }
}

/**
 * Armazena um valor no Redis com TTL (time-to-live).
 *
 * @param {string} chave - Chave no Redis
 * @param {unknown} valor - Valor a ser armazenado (serializado automaticamente para JSON)
 * @param {number} ttlSegundos - Tempo de vida em segundos
 * @returns {Promise<void>}
 *
 * @example
 * await redisSet("usuario:1", usuario, 300); // expira em 5 minutos
 */
export async function redisSet(
  chave: string,
  valor: unknown,
  ttlSegundos: number,
): Promise<void> {
  try {
    await redis.set(chave, JSON.stringify(valor), { EX: ttlSegundos });
  } catch {
    // Silencia erro: cache opcional, aplicação continua sem ele.
  }
}

/**
 * Remove uma chave específica do Redis.
 *
 * @param {string} chave - Chave a ser deletada
 * @returns {Promise<void>}
 *
 * @example
 * await redisDel("usuario:1");
 */
export async function redisDel(chave: string): Promise<void> {
  try {
    await redis.del(chave);
  } catch {
    // Silencia erro.
  }
}

/**
 * Remove todas as chaves que correspondem a um padrão (glob pattern).
 *
 * Como funciona:
 * 1. SCAN iterator percorre todas as chaves sem bloquear o Redis
 * 2. MATCH filtra apenas chaves que correspondem ao padrão (ex: "produtos:*")
 * 3. COUNT controla o número de chaves por iteração (performance)
 * 4. DEL remove todas as chaves encontradas em lote
 *
 * Útil para invalidar caches relacionados (ex: todas as listas de produtos).
 *
 * @param {string} padrao - Padrão glob (ex: "produtos:*", "categorias:*")
 * @returns {Promise<void>}
 *
 * @example
 * await redisDelPattern("produtos:*"); // deleta todos os caches de produtos
 */
export async function redisDelPattern(padrao: string): Promise<void> {
  try {
    const chaves: string[] = [];
    for await (const chave of redis.scanIterator({
      MATCH: padrao,
      COUNT: 100,
    })) {
      chaves.push(chave);
    }
    if (chaves.length > 0) {
      await redis.del(chaves);
    }
  } catch {
    // Silencia erro.
  }
}
