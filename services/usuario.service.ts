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
  comCache,
  invalidarCache,
  invalidarChave,
  chaveUsuario,
  chaveUsuarioMe,
  TTL,
} from "@/lib/cache";
import {
  ConflitoDeNegocio,
  OperacaoNaoAutorizada,
  RecursoNaoEncontrado,
} from "@/lib/errors/dominio";
import { revogarSessoesDoUsuario } from "./sessao.service";
import type { IdentidadeDaSessao } from "./sessao.service";
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
const USUARIO_PUBLICO = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  tipo: true,
  criadoEm: true,
} as const;

interface CriarUsuarioData {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo: "CLIENTE" | "MARCA" | "ADMIN";
  marcaNome?: string;
  marcaDescricao?: string;
}

interface AtualizarUsuarioData {
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
async function exigirSemConflitoDeCadastro(
  emailDoUsuario: string,
  marcaNome?: string,
) {
  const emailEmUso = await prisma.usuario.findFirst({
    where: { email: { equals: emailDoUsuario, mode: "insensitive" } },
    select: { id: true },
  });
  if (emailEmUso) throw new ConflitoDeNegocio("Email já cadastrado");

  if (marcaNome) {
    const marcaEmUso = await prisma.marca.findUnique({
      where: { nome: marcaNome },
      select: { id: true },
    });
    if (marcaEmUso) {
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
export async function criarUsuario(data: CriarUsuarioData) {
  const pedidoDeMarca = data.tipo === "MARCA" && !!data.marcaNome;
  const marcaPedida = pedidoDeMarca ? data.marcaNome : undefined;

  await exigirSemConflitoDeCadastro(data.email, marcaPedida);

  const senhaCriptografada = await bcrypt.hash(data.senha, SALT_ROUNDS);

  let usuario;
  try {
    usuario = await prisma.$transaction(async (tx) => {
      const criado = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          senha: senhaCriptografada,
          tipo: pedidoDeMarca ? "CLIENTE" : data.tipo,
        },
        select: USUARIO_PUBLICO,
      });

      if (pedidoDeMarca) {
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
      await exigirSemConflitoDeCadastro(data.email, marcaPedida);
    }
    throw err;
  }

  await invalidarCache("USUARIOS");
  if (pedidoDeMarca) await invalidarCache("MARCAS");

  return { ...usuario, marcaPendente: pedidoDeMarca };
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
    select: USUARIO_PUBLICO,
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
    select: USUARIO_PUBLICO,
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
export async function atualizarUsuario(
  id: number,
  data: AtualizarUsuarioData,
  solicitanteId?: number,
) {
  const { senhaAtual, ...campos } = data;

  // REQ-AUTH-21: quem troca a PRÓPRIA senha prova que a conhece (uma sessão
  // sequestrada não basta para tomar a conta). ADMIN alterando outro usuário não precisa.
  if (campos.senha && solicitanteId === id) {
    await exigirSenhaAtual(id, senhaAtual);
  }

  const updateData: Prisma.UsuarioUpdateInput = { ...campos };

  if (campos.senha) {
    updateData.senha = await bcrypt.hash(campos.senha, SALT_ROUNDS);
  }

  let usuario;
  try {
    usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: USUARIO_PUBLICO,
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
    invalidarChave(chaveUsuario(id)),
    invalidarChave(chaveUsuarioMe(id)),
    invalidarCache("USUARIOS"),
  ]);

  // REQ-AUTH-20: trocar a senha encerra as outras sessões (tokens de renovação).
  if (campos.senha) await revogarSessoesDoUsuario(id);

  return usuario;
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
export async function deletarUsuario(id: number, solicitanteId: number) {
  if (id === solicitanteId) {
    throw new ConflitoDeNegocio("Você não pode excluir a própria conta");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });

  if (!usuario) {
    throw new RecursoNaoEncontrado("Usuário");
  }

  await prisma.usuario.delete({ where: { id } });
  await revogarSessoesDoUsuario(id);
  await Promise.all([
    invalidarChave(chaveUsuario(id)),
    invalidarChave(chaveUsuarioMe(id)),
    invalidarCache("USUARIOS"),
  ]);

  return true;
}

/**
 * Confere a senha atual do usuário (REQ-AUTH-21).
 * @throws RecursoNaoEncontrado se o usuário não existe
 * @throws OperacaoNaoAutorizada se a senha atual falta ou não confere
 */
async function exigirSenhaAtual(id: number, senhaAtual: string | undefined) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { senha: true },
  });
  if (!usuario) throw new RecursoNaoEncontrado("Usuário");
  if (!senhaAtual || !(await bcrypt.compare(senhaAtual, usuario.senha))) {
    throw new OperacaoNaoAutorizada("Senha atual incorreta");
  }
}

/**
 * Hash de uma senha que ninguém conhece, calculado uma vez. Serve para gastar o
 * mesmo tempo de bcrypt quando o e-mail não existe (REQ-AUTH-23).
 */
let hashDeComparacao: Promise<string> | undefined;
const obterHashDeComparacao = () =>
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
export async function verificarCredenciais(
  emailInformado: string,
  senha: string,
): Promise<IdentidadeDaSessao | null> {
  const usuario = await prisma.usuario.findFirst({
    where: { email: { equals: emailInformado, mode: "insensitive" } },
  });
  const hash = usuario?.senha ?? (await obterHashDeComparacao());
  const confere = await bcrypt.compare(senha, hash);
  if (!usuario || !confere) return null;
  return { id: usuario.id, email: usuario.email, tipo: usuario.tipo };
}

/** Relê id, e-mail e papel atuais do usuário (renovação de sessão); `null` se foi excluído. */
export async function buscarIdentidade(
  id: number,
): Promise<IdentidadeDaSessao | null> {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true, email: true, tipo: true },
  });
}

/** Dados de "quem sou eu" (`/api/auth/me`), com cache curto. */
export async function buscarPerfilDaSessao(id: number) {
  return comCache(chaveUsuarioMe(id), TTL.USUARIO, () =>
    prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, tipo: true },
    }),
  );
}
