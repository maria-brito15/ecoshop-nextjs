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

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  userKey,
  currentUserKey,
  TTL,
} from "@/lib/cache";
import {
  ConflitoDeNegocio,
  OperacaoNaoAutorizada,
  RecursoNaoEncontrado,
} from "@/lib/errors/dominio";
import { revokeUserSessions } from "./sessao.service";
import type { SessionIdentity } from "./sessao.service";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

/**
 * Número de rounds de hashing do bcrypt.
 * 12 rounds = ~2^12 iterações = ~4,096 iterações.
 * Balanceamento: segurança (dificulta brute force) x performance (não impacta UX).
 */
const SALT_ROUNDS = 12;

/**
 * Campos de Usuario que podem sair do servidor.
 * NUNCA inclua `senha` aqui (Constitution, Art. IV): toda resposta de usuário
 * deve usar esta projeção em vez da entidade Prisma completa.
 */
const PUBLIC_USER_FIELDS = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  tipo: true,
  criadoEm: true,
} as const;

interface CreateUserData {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
  marcaNome?: string;
  marcaDescricao?: string;
}

interface UpdateUserData {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
  /** Obrigatória para trocar a PRÓPRIA senha (REQ-AUTH-21). */
  senhaAtual?: string;
}

const eViolacaoDeUnicidade = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/**
 * Lança `ConflitoDeNegocio` se o e-mail (ignorando a caixa) ou o nome da marca
 * pedida já existem. Serve tanto de atalho antes de gravar quanto para explicar
 * uma violação de unicidade detectada pelo banco.
 */
async function ensureNoRegistrationConflict(
  emailDoUsuario: string,
  brandName?: string,
) {
  const emailEmUso = await prisma.usuario.findFirst({
    where: { email: { equals: emailDoUsuario, mode: "insensitive" } },
    select: { id: true },
  });
  if (emailEmUso) throw new ConflitoDeNegocio("Email já cadastrado");

  if (brandName) {
    const brandInUse = await prisma.marca.findUnique({
      where: { nome: brandName },
      select: { id: true },
    });
    if (brandInUse) {
      throw new ConflitoDeNegocio("Já existe uma marca com esse nome");
    }
  }
}

/**
 * Cria um novo usuário no sistema.
 *
 * Validações:
 * - Verifica se email já está cadastrado
 * - Aplica hash na senha com bcrypt
 *
 * REQ-AUTH-11 / ADR-0018: quando `tipo === "MARCA"` e `marcaNome` é
 * informado (cadastro público, que exige o nome — REQ-AUTH-14), o usuário
 * é gravado como CLIENTE (direitos de CLIENTE enquanto pendente) e uma
 * `Marca` com `status: "PENDENTE"` é criada na mesma transação; só um
 * ADMIN aprovando (`aprovarMarca`) concede o tipo MARCA de fato.
 * Sem `marcaNome` (cadastro administrativo, que não pede esse campo), o
 * comportamento anterior é mantido: o tipo pedido é gravado direto.
 *
 * REQ-AUTH-15: o e-mail chega normalizado (minúsculas) pelo schema; a checagem
 * de duplicidade ignora a diferença de caixa para pegar contas antigas. Se duas
 * requisições simultâneas passarem pela checagem, a restrição única do banco
 * (P2002) decide, e o resultado também é 409.
 *
 * @param data - Dados do usuário
 * @returns Usuário criado (excluindo senha) e, se pendente, `marcaPendente: true`
 * @throws ConflitoDeNegocio se o e-mail (ou o nome da marca pedida) já existe
 */
export async function createUser(data: CreateUserData) {
  const brandRequest = data.tipo === "MARCA" && !!data.marcaNome;
  const requestedBrand = brandRequest ? data.marcaNome : undefined;

  await ensureNoRegistrationConflict(data.email, requestedBrand);

  const hashedPassword = await bcrypt.hash(data.senha, SALT_ROUNDS);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const criado = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          senha: hashedPassword,
          tipo: brandRequest ? "CLIENTE" : data.tipo,
        },
        select: PUBLIC_USER_FIELDS,
      });

      if (brandRequest) {
        await tx.marca.create({
          data: {
            nome: data.marcaNome!,
            descricao: data.marcaDescricao,
            status: "PENDENTE",
            usuarioId: criado.id,
          },
        });
      }

      return criado;
    });
  } catch (err) {
    // Corrida entre duas requisições: o banco recusou; explica qual valor conflitou.
    if (eViolacaoDeUnicidade(err)) {
      await ensureNoRegistrationConflict(data.email, requestedBrand);
    }
    throw err;
  }

  await invalidateCache("USERS");
  if (brandRequest) await invalidateCache("BRANDS");

  return { ...user, marcaPendente: brandRequest };
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
export async function listUsers() {
  return prisma.usuario.findMany({
    select: PUBLIC_USER_FIELDS,
  });
}

/**
 * Busca um usuário pelo ID.
 *
 * @param id - ID do usuário
 * @returns Usuário encontrado (excluindo senha) ou null
 */
export async function getUser(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: PUBLIC_USER_FIELDS,
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
 * @param solicitanteId - Quem pede a atualização (a sessão); define se a senha atual é exigida
 * @returns Usuário atualizado
 * @throws ConflitoDeNegocio se o novo e-mail já pertence a outro usuário
 * @throws OperacaoNaoAutorizada (403) se trocar a própria senha sem a senha atual correta
 * @throws PrismaClientKnownRequestError P2025 se o usuário não existir (o handler mapeia para 404)
 */
export async function updateUser(
  id: number,
  data: UpdateUserData,
  solicitanteId?: number,
) {
  const { senhaAtual, ...campos } = data;

  // REQ-AUTH-21: quem troca a PRÓPRIA senha prova que a conhece (uma sessão
  // sequestrada não basta para tomar a conta). ADMIN alterando outro usuário não precisa.
  if (campos.senha && solicitanteId === id) {
    await requireCurrentPassword(id, senhaAtual);
  }

  const updateData: Prisma.UsuarioUpdateInput = { ...campos };

  if (campos.senha) {
    updateData.senha = await bcrypt.hash(campos.senha, SALT_ROUNDS);
  }

  let user;
  try {
    user = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: PUBLIC_USER_FIELDS,
    });
  } catch (err) {
    // `email` é a única coluna única de Usuario que esta atualização altera.
    if (eViolacaoDeUnicidade(err)) {
      throw new ConflitoDeNegocio("Email já cadastrado");
    }
    throw err;
  }

  // Invalida múltiplas chaves de cache em paralelo
  await Promise.all([
    invalidateKey(userKey(id)),
    invalidateKey(currentUserKey(id)),
    invalidateCache("USERS"),
  ]);

  // REQ-AUTH-20: trocar a senha encerra as outras sessões (tokens de renovação).
  if (campos.senha) await revokeUserSessions(id);

  return user;
}

/**
 * Deleta um usuário.
 * Requer autenticação ADMIN.
 *
 * REQ-USR-08: ninguém exclui a própria conta por aqui (evita ficar sem ADMIN).
 *
 * @param id - ID do usuário a ser deletado
 * @param solicitanteId - ID de quem pede a exclusão (a sessão)
 * @returns true se deletado com sucesso
 * @throws ConflitoDeNegocio se for a própria conta
 * @throws RecursoNaoEncontrado se o usuário não existir
 * @throws PrismaClientKnownRequestError P2003 se tiver dependências (ex.: marca); o handler mapeia para 409
 */
export async function deleteUser(id: number, solicitanteId: number) {
  if (id === solicitanteId) {
    throw new ConflitoDeNegocio("Você não pode excluir a própria conta");
  }

  const user = await prisma.usuario.findUnique({ where: { id } });

  if (!user) {
    throw new RecursoNaoEncontrado("Usuário");
  }

  await prisma.usuario.delete({ where: { id } });
  await revokeUserSessions(id);
  await Promise.all([
    invalidateKey(userKey(id)),
    invalidateKey(currentUserKey(id)),
    invalidateCache("USERS"),
  ]);

  return true;
}

/**
 * Confere a senha atual do usuário (REQ-AUTH-21).
 * @throws RecursoNaoEncontrado se o usuário não existe
 * @throws OperacaoNaoAutorizada se a senha atual falta ou não confere
 */
async function requireCurrentPassword(id: number, senhaAtual: string | undefined) {
  const user = await prisma.usuario.findUnique({
    where: { id },
    select: { senha: true },
  });
  if (!user) throw new RecursoNaoEncontrado("Usuário");
  if (!senhaAtual || !(await bcrypt.compare(senhaAtual, user.senha))) {
    throw new OperacaoNaoAutorizada("Senha atual incorreta");
  }
}

/**
 * Hash de uma senha que ninguém conhece, calculado uma vez. Serve para gastar o
 * mesmo tempo de bcrypt quando o e-mail não existe (REQ-AUTH-23).
 */
let hashDeComparacao: Promise<string> | undefined;
const getDummyHash = () =>
  (hashDeComparacao ??= bcrypt.hash(
    randomBytes(16).toString("hex"),
    SALT_ROUNDS,
  ));

/**
 * Confere e-mail e senha do login.
 *
 * REQ-AUTH-23: sempre executa a comparação do bcrypt, mesmo quando o e-mail não
 * existe, para que o tempo de resposta não revele quais e-mails têm conta.
 * REQ-AUTH-15: o e-mail é comparado ignorando a caixa (contas antigas).
 *
 * @returns a identidade da sessão, ou `null` se as credenciais não conferem
 */
export async function verifyCredentials(
  emailInformado: string,
  password: string,
): Promise<SessionIdentity | null> {
  const user = await prisma.usuario.findFirst({
    where: { email: { equals: emailInformado, mode: "insensitive" } },
  });
  const hash = user?.senha ?? (await getDummyHash());
  const confere = await bcrypt.compare(password, hash);
  if (!user || !confere) return null;
  return { id: user.id, email: user.email, tipo: user.tipo };
}

/** Relê id, e-mail e papel atuais do usuário (renovação de sessão); `null` se foi excluído. */
export async function getIdentity(
  id: number,
): Promise<SessionIdentity | null> {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true, email: true, tipo: true },
  });
}

/** Dados de "quem sou eu" (`/api/auth/me`), com cache curto. */
export async function getSessionProfile(id: number) {
  return withCache(currentUserKey(id), TTL.USER, () =>
    prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, tipo: true },
    }),
  );
}
