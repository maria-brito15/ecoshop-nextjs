// services/produto.service.ts

/**
 * ============================================================================
 * PRODUTO SERVICE
 * ============================================================================
 * Camada de serviço para operações CRUD de produtos.
 *
 * Produtos são o core da plataforma - representam itens sustentáveis à venda.
 *
 * Cache strategy:
 * - LISTA_PRODUTOS (2 min) para listagens paginadas
 * - ITEM (3 min) para produtos individuais
 * - A chave da listagem inclui todos os parâmetros de query
 * - Invalidação em write: todas as chaves com prefixo "produtos:*"
 *
 * Relacionamentos incluídos:
 * - Categoria (dados completos)
 * - Marca (dados completos)
 * - Certificados (via ProdutoCertificado, inclui certificado completo)
 *
 * @see lib/cache/keys.ts - Funções de geração de chaves
 * @see lib/cache/ttl.ts - Constantes de TTL
 * ============================================================================
 */

import { prisma } from "@/lib/db";
import {
  withCache,
  invalidateCache,
  invalidateKey,
  productListKey,
  productKey,
  TTL,
} from "@/lib/cache";
import type {
  ListProductsQuery,
  ProductInput,
  UpdateProductInput,
} from "@/lib/schemas/produto";

/**
 * Ordenações aceitas por `listarProdutos` (REQ-CAT-06).
 */
const ORDER_BY_SORT = {
  relevancia: { id: "asc" as const },
  preco_asc: { preco: "asc" as const },
  preco_desc: { preco: "desc" as const },
  nome_asc: { nome: "asc" as const },
  nome_desc: { nome: "desc" as const },
};

/**
 * Lista produtos com paginação e filtros.
 *
 * Recebe os filtros JÁ VALIDADOS (`listarProdutosQuerySchema`; os padrões de
 * `page`, `size` e `sort` vêm do schema, não daqui):
 * - page: número da página (padrão: 1)
 * - size: itens por página (padrão: 12)
 * - categoriaId: filtrar por categoria
 * - marcaId: filtrar por marca (REQ-CAT-07)
 * - precoMax: preço máximo (REQ-CAT-06)
 * - sort: relevancia (padrão) | preco_asc | preco_desc | nome_asc | nome_desc (REQ-CAT-06)
 * - nome: busca textual por nome (case-insensitive, até 100 caracteres)
 *
 * `where`/`orderBy` são resolvidos pelo Prisma (banco), não em memória —
 * por isso a ordenação e o limite de preço valem para o catálogo inteiro,
 * e não só para os itens da página devolvida (REQ-CAT-06).
 *
 * Cache: LISTA_PRODUTOS (2 minutos)
 * A chave (REQ-CAT-10) sai dos filtros validados, em ordem fixa.
 *
 * @param query - Filtros validados
 * @returns Objeto paginado com produtos, total, página atual e tamanho
 */
export async function listProducts(query: ListProductsQuery) {
  const { page, size, categoriaId: categoryId, marcaId: brandId, precoMax, sort, nome: name } = query;

  // A chave sai dos filtros validados (REQ-CAT-10), nunca da URL crua.
  const key = productListKey(query);

  return withCache(key, TTL.PRODUCT_LIST, async () => {
    const where = {
      ...(categoryId !== undefined && { categoriaId: categoryId }),
      ...(brandId !== undefined && { marcaId: brandId }),
      ...(precoMax !== undefined && { preco: { lte: precoMax } }),
      ...(name && { nome: { contains: name, mode: "insensitive" as const } }),
    };

    const [products, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: { select: { id: true, nome: true } },
          marca: { select: { id: true, nome: true } },
          certificados: { include: { certificado: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: ORDER_BY_SORT[sort],
      }),
      prisma.produto.count({ where }),
    ]);

    return { produtos: products, page, size, total };
  });
}

/**
 * Cria um novo produto.
 * Requer autenticação ADMIN.
 *
 * @param data - Dados do produto (nome, preco, categoriaId, marcaId, descricao opcional)
 * @returns Produto recém-criado com categorias e marca incluídas
 */
export async function createProduct(data: ProductInput) {
  const product = await prisma.produto.create({
    data,
    include: { categoria: true, marca: true },
  });

  await invalidateCache("PRODUCTS");
  return product;
}

/**
 * Busca um produto pelo ID.
 *
 * Inclui:
 * - Categoria (dados completos)
 * - Marca (dados completos)
 * - Certificados (com dados completos do certificado)
 *
 * @param id - ID do produto
 * @returns Produto encontrado com relacionamentos ou null
 */
export async function getProduct(id: number) {
  return withCache(productKey(id), TTL.ITEM, () =>
    prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        certificados: { include: { certificado: true } },
      },
    }),
  );
}

/**
 * Atualiza um produto existente.
 * Requer autenticação ADMIN.
 *
 * REQ-PROD-05: se `certificadoIds` vier no corpo, substitui por completo o
 * vínculo produto↔certificado (remove os antigos, cria os novos, numa
 * transação). Omitir o campo não altera o vínculo existente.
 *
 * @param id - ID do produto a ser atualizado
 * @param data - Dados para atualização (todos opcionais)
 * @returns Produto atualizado com relacionamentos
 * @throws Error P2025 se o produto não existir
 * @throws Error P2003 se algum certificadoId não existir
 */
export async function updateProduct(
  id: number,
  data: UpdateProductInput,
) {
  const { certificadoIds: certificateIds, ...produtoData } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (Object.keys(produtoData).length > 0) {
      await tx.produto.update({ where: { id }, data: produtoData });
    } else {
      await tx.produto.findUniqueOrThrow({ where: { id } });
    }

    if (certificateIds !== undefined) {
      await tx.produtoCertificado.deleteMany({ where: { produtoId: id } });
      const unicos = [...new Set(certificateIds)];
      if (unicos.length > 0) {
        await tx.produtoCertificado.createMany({
          data: unicos.map((certificateId) => ({
            produtoId: id,
            certificadoId: certificateId,
          })),
        });
      }
    }

    return tx.produto.findUniqueOrThrow({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        certificados: { include: { certificado: true } },
      },
    });
  });

  await Promise.all([
    invalidateKey(productKey(id)),
    invalidateCache("PRODUCTS"),
  ]);
  return product;
}

/**
 * Deleta um produto.
 * Requer autenticação ADMIN.
 *
 * REQ-PROD-07: produto com certificados vinculados NÃO pode ser excluído
 * (decisão do dono, 2026-11-11: bloqueio). A chave estrangeira de
 * `produto_certificado` é `ON DELETE RESTRICT` (não há cascata); o banco recusa
 * (P2003) e o handler responde 409. Para excluir, desvincule antes os
 * certificados (`atualizarProduto` com `certificadoIds: []`).
 *
 * @param id - ID do produto a ser deletado
 * @throws PrismaClientKnownRequestError P2025 se o produto não existir (404) ou P2003 se houver vínculos (409)
 */
export async function deleteProduct(id: number) {
  await prisma.produto.delete({ where: { id } });
  await Promise.all([
    invalidateKey(productKey(id)),
    invalidateCache("PRODUCTS"),
  ]);
}
