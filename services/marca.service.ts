// services/marca.service.ts

/**
 * ============================================================================
 * MARCA SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de marcas.
 *
 * Marcas representam fabricantes/empresas parceiras da EcoShop.
 * Cada marca está associada a um usuário do tipo "MARCA" ou "ADMIN".
 *
 * Relacionamentos:
 * - 1:1 com Usuario (usuário responsável pela marca)
 * - 1:N com Produto (uma marca pode ter múltiplos produtos)
 *
 * Cache strategy:
 * - LISTA_CURTA (5 min) para listagens completas
 * - ITEM (3 min) para marcas individuais
 * - Invalidação em write: todas as chaves com prefixo "marcas:*"
 *
 * @see lib/cache/keys.ts - Funções de geração de chaves
 * @see lib/cache/ttl.ts - Constantes de TTL
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import { ResourceNotFound, BusinessConflict } from "@/lib/errors/dominio";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  brandsKey,
  brandKey,
  userKey,
  currentUserKey,
  TTL,
} from "@/lib/cache";

/**
 * Lista todas as marcas ordenadas por nome.
 * Endpoint público - usuários podem ver marcas antes de comprar.
 *
 * Cache: LISTA_CURTA (5 minutos)
 * Chave: "marcas:lista"
 *
 * Inclui dados resumidos do usuário responsável (id, nome, email).
 *
 * @returns Array de marcas com dados do usuário associado
 */
export async function listBrands() {
  return withCache(brandsKey(), TTL.SHORT_LIST, () =>
    prisma.marca.findMany({
      orderBy: { nome: "asc" },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    }),
  );
}

/**
 * Busca uma marca pelo ID.
 *
 * Inclui:
 * - Dados do usuário responsável
 * - Lista de produtos da marca
 *
 * @param id - ID da marca
 * @returns Marca encontrada com relacionamentos ou null
 */
export async function getBrand(id: number) {
  return withCache(brandKey(id), TTL.ITEM, () =>
    prisma.marca.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        produtos: true,
      },
    }),
  );
}

/**
 * Cria uma nova marca.
 * Requer autenticação ADMIN.
 *
 * @param data - Dados da marca
 * @param data.nome - Nome da marca (ex: "EcoBrand")
 * @param data.descricao - Descrição opcional da marca
 * @param data.usuarioId - ID do usuário responsável (tipo MARCA ou ADMIN)
 * @returns Marca recém-criada com dados do usuário
 *
 * @example
 * const marca = await criarMarca({
 *   nome: "EcoBrand",
 *   descricao: "Roupas sustentáveis",
 *   usuarioId: 5
 * });
 *
 * @throws Error("USUARIO_NAO_ENCONTRADO") se usuarioId não existir
 * @throws Error("USUARIO_TIPO_INVALIDO") se o usuário não for MARCA nem ADMIN
 *   (REQ-REF-04; decisão registrada em docs/capabilities/cadastros-de-referencia/spec.md)
 *
 * NOTA (ADR-0018): este caminho é usado pelo ADMIN no painel, com o usuário
 * já no tipo MARCA/ADMIN — por isso a marca entra direto como APROVADA, ao
 * contrário do pedido criado pelo cadastro público (`criarUsuario`), que
 * entra PENDENTE.
 */
export async function createBrand(data: {
  nome: string;
  descricao?: string;
  usuarioId: number;
}) {
  const user = await prisma.usuario.findUnique({
    where: { id: data.usuarioId },
  });
  if (!user) {
    throw new ResourceNotFound("Usuário");
  }
  if (user.tipo !== "MARCA" && user.tipo !== "ADMIN") {
    throw new BusinessConflict(
      "O usuário responsável por uma marca precisa ser do tipo MARCA ou ADMIN",
    );
  }

  const brand = await prisma.marca.create({
    data: { ...data, status: "APROVADA" },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  await invalidateCache("BRANDS");
  return brand;
}

/**
 * Aprova uma marca pendente: muda `Marca.status` para APROVADA e concede
 * o tipo MARCA ao usuário associado, de forma atômica.
 *
 * REQ-USR-03, ADR-0018.
 *
 * @param id - ID da marca pendente
 * @returns Marca aprovada com dados do usuário
 * @throws Error("MARCA_NAO_ENCONTRADA") se a marca não existir
 * @throws Error("MARCA_NAO_PENDENTE") se a marca já não estiver PENDENTE
 */
export async function approveBrand(id: number) {
  const brand = await prisma.marca.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Marca");
  }
  if (brand.status !== "PENDENTE") {
    throw new BusinessConflict("Esta marca já não está pendente de aprovação");
  }

  const approved = await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: brand.usuarioId },
      data: { tipo: "MARCA" },
    });
    return tx.marca.update({
      where: { id },
      data: { status: "APROVADA" },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });
  });

  await Promise.all([
    invalidateKey(brandKey(id)),
    invalidateCache("BRANDS"),
    invalidateKey(userKey(brand.usuarioId)),
    invalidateKey(currentUserKey(brand.usuarioId)),
    invalidateCache("USERS"),
  ]);

  return approved;
}

/**
 * Atualiza uma marca existente.
 * Requer autenticação ADMIN.
 *
 * NOTA: usuarioId NÃO pode ser alterado após a criação.
 * Para transferir responsabilidade, um admin deve criar uma nova marca.
 *
 * @param id - ID da marca a ser atualizada
 * @param data - Dados para atualização (nome, descrição - ambos opcionais)
 * @returns Marca atualizada
 * @throws Error P2025 se marca não existir
 *
 * NOTA (REQ-PROD-02, NFR-CONS-01): também invalida o cache de produtos,
 * porque a listagem e o detalhe de produto embutem o nome da marca.
 * Sem isso, renomear a marca só refletia nos produtos após o TTL de 2–3 min.
 */
export async function updateBrand(
  id: number,
  data: { nome?: string; descricao?: string },
) {
  const brand = await prisma.marca.update({ where: { id }, data });
  await Promise.all([
    invalidateKey(brandKey(id)),
    invalidateCache("BRANDS"),
    invalidateCache("PRODUCTS"),
  ]);
  return brand;
}

/**
 * Deleta uma marca.
 * Requer autenticação ADMIN.
 *
 * ATENÇÃO: Marcas com produtos associados NÃO podem ser deletadas
 * devido à constraint de chave estrangeira no banco.
 *
 * @param id - ID da marca a ser deletada
 * @returns true se deletado com sucesso
 * @throws Error P2025 se marca não existir
 * @throws Error P2003 se marca possui produtos vinculados
 */
export async function deleteBrand(id: number) {
  const brand = await prisma.marca.findUnique({ where: { id } });
  if (!brand) {
    throw new ResourceNotFound("Marca");
  }

  await prisma.marca.delete({ where: { id } });
  await Promise.all([invalidateKey(brandKey(id)), invalidateCache("BRANDS")]);
  return true;
}
