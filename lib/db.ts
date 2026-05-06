// lib/db.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// o Next.js em desenvolvimento reinicia o servidor a cada mudança de arquivo
// isso faria o Node criar uma nova conexão com o banco a cada reload, esgotando o pool
// a solução é guardar o PrismaClient no globalThis, que sobrevive aos reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // se a variável de ambiente não existir (ex: desenvolvedor novo sem .env configurado)
  // cria um cliente com uma string de conexão falsa só para o processo não quebrar na inicialização
  // na prática vai falhar quando tentar consultar o banco, mas evita crash imediato
  if (!connectionString) {
    const pool = new pg.Pool({
      connectionString:
        "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // caminho normal: cria o pool de conexões com a URL real do banco
  // pg.Pool gerencia múltiplas conexões simultâneas automaticamente
  const pool = new pg.Pool({ connectionString });

  // PrismaPg é o adapter que faz o Prisma usar o driver pg ao invés do driver padrão
  // necessário porque o projeto usa @prisma/adapter-pg para melhor compatibilidade
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// se já existe um prisma no globalThis, reutiliza — senão, cria um novo
// isso garante que só existe uma instância do PrismaClient em toda a aplicação
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// salva a instância no globalThis APENAS em desenvolvimento
// em produção não é necessário porque o servidor não fica reiniciando
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
