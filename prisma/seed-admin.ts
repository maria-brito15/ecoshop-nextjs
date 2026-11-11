// prisma/seed-admin.ts

/**
 * ============================================================================
 * SEED ADMIN SCRIPT - CRIAÇÃO DE ADMINISTRADOR
 * ============================================================================
 * Script específico para criar um usuário administrador no banco de dados.
 *
 * Por que um script separado?
 * - O seed principal (seed.ts) usa placeholders de senha ("hash-seguro-aqui")
 * - Este script gera um hash bcrypt REAL a partir de uma senha fornecida
 * - Permite criar um admin com credenciais funcionais para login
 *
 * Como usar:
 *   1. Defina as variáveis de ambiente (ou edite os valores diretamente)
 *   2. Execute: npx tsx prisma/seed-admin.ts
 *
 * Não há senha embutida (REQ-OPS-09): ADMIN_PASSWORD é obrigatória, com no
 * mínimo 12 caracteres; sem ela o script encerra antes de gravar qualquer coisa.
 *
 * Variáveis de ambiente:
 *   ADMIN_PASSWORD - Senha do administrador (obrigatória, 12+ caracteres)
 *   ADMIN_EMAIL - Email do administrador (padrão: admin@ecoshop.com)
 *   ADMIN_NAME - Nome do administrador (opcional)
 *   ADMIN_PHONE - Telefone do administrador (opcional)
 *
 * @see prisma/seed.ts - Seed completo com dados de demonstração
 * ============================================================================
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, TipoUsuario } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { requireSeedPassword } from "./senha-seed";

/**
 * Configurações do administrador.
 * Pode ser sobrescrita por variáveis de ambiente.
 */
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || "admin@ecoshop.com",
  senha: requireSeedPassword("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD),
  nome: process.env.ADMIN_NAME || "Administrador EcoShop",
  telefone: process.env.ADMIN_PHONE || "(11) 99999-8888",
};

/**
 * Número de rounds de hashing do bcrypt.
 * Mesmo valor usado no service (SALT_ROUNDS = 12).
 */
const SALT_ROUNDS = 12;

/**
 * String de conexão com o banco de dados.
 */
const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Gera um hash bcrypt a partir da senha.
 *
 * @param password - Senha em texto plano
 * @returns Hash bcrypt da senha
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Cria ou atualiza o usuário administrador.
 *
 * Se o email já existir, atualiza a senha e o nome para os valores atuais.
 * Isso garante que você sempre tenha um admin funcional, mesmo se o seed
 * principal foi executado com placeholders.
 */
async function createOrUpdateAdmin() {
  console.log("\n🔧 Configurando administrador...");
  console.log(`   Email: ${ADMIN_CONFIG.email}`);
  console.log(`   Nome: ${ADMIN_CONFIG.nome}`);
  console.log(`   Senha: ${"•".repeat(ADMIN_CONFIG.senha.length)} (oculta)`);

  // A senha já foi validada ao montar ADMIN_CONFIG (REQ-OPS-09).

  // Gera hash da senha
  const passwordHash = await hashPassword(ADMIN_CONFIG.senha);

  // Verifica se já existe um usuário com este email
  const existingUser = await prisma.usuario.findUnique({
    where: { email: ADMIN_CONFIG.email },
  });

  if (existingUser) {
    // Atualiza usuário existente
    console.log("\n📝 Usuário já existe. Atualizando dados...");

    const updatedUser = await prisma.usuario.update({
      where: { email: ADMIN_CONFIG.email },
      data: {
        nome: ADMIN_CONFIG.nome,
        senha: passwordHash,
        telefone: ADMIN_CONFIG.telefone,
        tipo: TipoUsuario.ADMIN,
      },
    });

    console.log("\n✅ Administrador atualizado com sucesso!");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Tipo: ${updatedUser.tipo}`);
  } else {
    // Cria novo usuário administrador
    console.log("\n📝 Criando novo administrador...");

    const novoAdmin = await prisma.usuario.create({
      data: {
        nome: ADMIN_CONFIG.nome,
        email: ADMIN_CONFIG.email,
        senha: passwordHash,
        telefone: ADMIN_CONFIG.telefone,
        tipo: TipoUsuario.ADMIN,
      },
    });

    console.log("\n✅ Administrador criado com sucesso!");
    console.log(`   ID: ${novoAdmin.id}`);
    console.log(`   Email: ${novoAdmin.email}`);
    console.log(`   Tipo: ${novoAdmin.tipo}`);
  }
}

/**
 * Lista todos os administradores existentes no sistema.
 * Útil para verificar quais contas admin estão disponíveis.
 */
async function listAdmins() {
  const admins = await prisma.usuario.findMany({
    where: { tipo: TipoUsuario.ADMIN },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
    },
  });

  if (admins.length > 0) {
    console.log("\n📋 Administradores existentes no sistema:");
    for (const admin of admins) {
      console.log(`   • ${admin.nome} (${admin.email}) - ID: ${admin.id}`);
    }
  } else {
    console.log("\n⚠️ Nenhum administrador encontrado no sistema.");
  }

  return admins;
}

/**
 * Função principal
 */
async function main() {
  console.log("\n🌿 ========================================");
  console.log("   ECOSHOP - SEED DE ADMINISTRADOR");
  console.log("   ========================================\n");

  try {
    // Testa conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conexão com banco de dados estabelecida.\n");

    // Lista admins existentes antes da operação
    await listAdmins();

    // Cria ou atualiza o admin principal
    await createOrUpdateAdmin();

    // Lista admins atualizados
    await listAdmins();

    // A senha NUNCA é impressa: logs de Docker e de CI ficam retidos (REQ-OPS-09).
    console.log("\n🔐 Administrador pronto.");
    console.log(`   📧 Email: ${ADMIN_CONFIG.email}`);
    console.log("   🔑 Senha: a definida em ADMIN_PASSWORD (não exibida).");
    console.log("   Acesse o painel em /painel.\n");
  } catch (error) {
    console.error("\n❌ Erro ao executar seed de administrador:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
main();
