// lib/db.ts

/**
 * ============================================================================
 * DATABASE CONNECTION
 * ============================================================================
 * Este módulo gerencia a conexão com o banco de dados PostgreSQL usando Prisma ORM.
 *
 * Características importantes:
 * - Singleton pattern: reutiliza a mesma conexão em todo o ciclo de vida da aplicação
 * - Adapter PostgreSQL nativo (pg) para maior performance
 * - Proxy para lazy loading — evita inicialização prematura do PrismaClient
 *
 * IMPORTANTE: O PrismaClient é instanciado apenas na primeira vez que é usado.
 * Isso evita múltiplas conexões em desenvolvimento (hot reload) e otimiza
 * o uso de recursos em produção.
 * ============================================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Referência global para o singleton do PrismaClient.
 * Usa globalThis para persistir entre hot reloads em desenvolvimento.
 * Em produção, a variável é única por instância do servidor.
 */
let _prisma: PrismaClient | undefined;

/**
 * Cria ou retorna a instância existente do PrismaClient.
 * A conexão só é estabelecida quando esta função é chamada pela primeira vez.
 *
 * @returns {PrismaClient} Instância configurada do PrismaClient
 * @throws {Error} Se DATABASE_URL não estiver definida no ambiente
 *
 * Configuração do adapter:
 * - pg.Pool: gerenciador de pool de conexões PostgreSQL
 * - PrismaPg: adaptador oficial do Prisma para PostgreSQL
 *
 * O pool de conexões gerencia automaticamente:
 * - Reutilização de conexões
 * - Limite máximo de conexões simultâneas
 * - Timeout e reconexão em falhas
 */
function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[lib/db] DATABASE_URL não definida. Configure a variável de ambiente.",
    );
  }

  // Cria pool de conexões PostgreSQL
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // Instancia o PrismaClient com o adapter
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

/**
 * Proxy do PrismaClient que permite lazy loading.
 *
 * Por que um Proxy?
 * - O PrismaClient tem muitas propriedades e métodos
 * - Inicializar ele prematuramente conectaria ao banco mesmo se não usado
 * - O proxy atrasa a inicialização até o primeiro acesso a qualquer propriedade
 *
 * Como usar:
 * ```ts
 * import { prisma } from "@/lib/db";
 * const usuarios = await prisma.usuario.findMany();
 * ```
 *
 * Na primeira vez que qualquer método (findMany, create, etc.) for chamado,
 * o getPrisma() é executado, estabelecendo a conexão.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop];
  },
});
