// services/usuario.service.ts

/**
 * ============================================================================
 * USUARIO SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de usuários.
 *
 * Responsabilidades:
 * - Hash de senhas com bcrypt (12 rounds - segurança x performance)
 * - Validação de unicidade de email
 * - Cache de usuários (me, individual, listagem)
 * - Invalidação de cache em mutações
 *
 * Segurança:
 * - Senhas nunca são retornadas em respostas de API
 * - Buscas sempre excluem o campo "senha" (select explícito)
 * - Hash com bcrypt (SALT_ROUNDS = 12)
 *
 * Cache strategy:
 * - USUARIO (60s) para dados individuais
 * - Listagem de usuários NÃO é cacheadas (dados sensíveis)
 *
 * @see lib/cache/keys.ts - Funções de geração de chaves
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import {
  invalidarCache,
  invalidarChave,
  chaveUsuario,
  chaveUsuarios,
  chaveUsuarioMe,
} from "@/lib/cache";
import bcrypt from "bcryptjs";

/**
 * Número de rounds de hashing do bcrypt.
 * 12 rounds = ~2^12 iterações = ~4,096 iterações.
 * Balanceamento: segurança (dificulta brute force) x performance (não impacta UX).
 */
const SALT_ROUNDS = 12;

interface CriarUsuarioData {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
}

interface AtualizarUsuarioData {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
}

/**
 * Cria um novo usuário no sistema.
 *
 * Validações:
 * - Verifica se email já está cadastrado
 * - Aplica hash na senha com bcrypt
 *
 * @param data - Dados do usuário
 * @returns Usuário criado (excluindo senha)
 * @throws Error("EMAIL_JA_CADASTRADO") se email já existe
 */
export async function criarUsuario(data: CriarUsuarioData) {
  const existingUser = await prisma.usuario.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new Error("EMAIL_JA_CADASTRADO");
  }

  const senhaCriptografada = await bcrypt.hash(data.senha, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      senha: senhaCriptografada,
      tipo: data.tipo,
    },
  });

  await invalidarCache("USUARIOS");
  return usuario;
}

/**
 * Lista todos os usuários (admin only).
 *
 * Campos retornados (exclui senha por segurança):
 * - id, nome, email, telefone, tipo, criadoEm
 *
 * NOTA: Esta listagem NÃO usa cache por conter dados sensíveis.
 *
 * @returns Array de usuários com campos públicos
 */
export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      criadoEm: true,
    },
  });
}

/**
 * Busca um usuário pelo ID.
 *
 * @param id - ID do usuário
 * @returns Usuário encontrado (excluindo senha) ou null
 */
export async function buscarUsuario(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      criadoEm: true,
    },
  });
}

/**
 * Atualiza um usuário existente.
 *
 * Se a senha for fornecida, aplica hash antes de salvar.
 *
 * Invalidação de cache:
 * - Remove chave individual do usuário
 * - Remove chave "me" do usuário
 * - Remove listagem de usuários (admin)
 *
 * @param id - ID do usuário a ser atualizado
 * @param data - Dados para atualização (todos opcionais)
 * @returns Usuário atualizado
 * @throws Error P2025 se usuário não existir
 */
export async function atualizarUsuario(id: number, data: AtualizarUsuarioData) {
  const updateData: any = { ...data };

  if (data.senha) {
    updateData.senha = await bcrypt.hash(data.senha, SALT_ROUNDS);
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: updateData,
  });

  // Invalida múltiplas chaves de cache em paralelo
  await Promise.all([
    invalidarChave(chaveUsuario(id)),
    invalidarChave(chaveUsuarioMe(id)),
    invalidarCache("USUARIOS"),
  ]);

  return usuario;
}

/**
 * Deleta um usuário.
 * Requer autenticação ADMIN.
 *
 * @param id - ID do usuário a ser deletado
 * @returns true se deletado com sucesso
 * @throws Error P2025 se usuário não existir
 * @throws Error P2003 se usuário possui dependências (marca, produtos)
 */
export async function deletarUsuario(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });

  if (!usuario) {
    throw new Error("P2025");
  }

  await prisma.usuario.delete({ where: { id } });
  await Promise.all([
    invalidarChave(chaveUsuario(id)),
    invalidarChave(chaveUsuarioMe(id)),
    invalidarCache("USUARIOS"),
  ]);

  return true;
}
