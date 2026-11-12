// lib/db.ts

/**
 * DATABASE CONNECTION
 *
 * This module manages the PostgreSQL connection using the Prisma ORM.
 *
 * Important characteristics:
 * - Singleton pattern: reuses the same connection for the whole application lifetime
 * - Native PostgreSQL adapter (pg) for better performance
 * - Proxy for lazy loading — avoids premature PrismaClient initialization
 *
 * IMPORTANT: The PrismaClient is only instantiated the first time it is used.
 * This avoids multiple connections in development (hot reload) and optimizes
 * resource use in production.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Global reference to the PrismaClient singleton.
 * Uses globalThis to persist across hot reloads in development.
 * In production, the variable is unique per server instance.
 */
let _prisma: PrismaClient | undefined;

/**
 * Creates or returns the existing PrismaClient instance.
 * The connection is only established the first time this function is called.
 *
 * @returns {PrismaClient} Configured PrismaClient instance
 * @throws {Error} If DATABASE_URL is not defined in the environment
 *
 * Adapter configuration:
 * - pg.Pool: PostgreSQL connection pool manager
 * - PrismaPg: Prisma's official PostgreSQL adapter
 *
 * The connection pool automatically manages:
 * - Connection reuse
 * - Maximum number of simultaneous connections
 * - Timeout and reconnection on failure
 */
function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[lib/db] DATABASE_URL is not set. Configure the environment variable.",
    );
  }

  // Creates the PostgreSQL connection pool
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // Instantiates the PrismaClient with the adapter
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

/**
 * PrismaClient proxy that enables lazy loading.
 *
 * Why a Proxy?
 * - The PrismaClient has many properties and methods
 * - Initializing it prematurely would connect to the database even if unused
 * - The proxy delays initialization until the first access to any property
 *
 * How to use:
 * ```ts
 * import { prisma } from "@/lib/db";
 * const users = await prisma.user.findMany();
 * ```
 *
 * The first time any method (findMany, create, etc.) is called,
 * getPrisma() runs, establishing the connection.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});
