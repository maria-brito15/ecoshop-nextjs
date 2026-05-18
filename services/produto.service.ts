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
  comCache,
  invalidarCache,
  invalidarChave,
  chaveProdutos,
  chaveProduto,
  TTL,
} from "@/lib/cache";
import type {
  ProdutoInput,
  AtualizarProdutoInput,
} from "@/lib/schemas/produto";

/**
 * Lista produtos com paginação e filtros.
 *
 * Filtros suportados via searchParams:
 * - page: número da página (padrão: 1)
 * - size: itens por página (padrão: 12)
 * - categoriaId: filtrar por categoria
 * - nome: busca textual por nome (case-insensitive)
 *
 * Cache: LISTA_PRODUTOS (2 minutos)
 * A chave inclui todos os parâmetros para distinguir diferentes filtros.
 *
 * @param searchParams - Parâmetros de query da URL
 * @returns Objeto paginado com produtos, total, página atual e tamanho
 */
export async function listarProdutos(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") ?? 1);
  const size = Number(searchParams.get("size") ?? 12);
  const categoriaId = searchParams.get("categoriaId");
  const nome = searchParams.get("nome");

  const chave = chaveProdutos(searchParams);

  return comCache(chave, TTL.LISTA_PRODUTOS, async () => {
    const where = {
      ...(categoriaId && { categoriaId: Number(categoriaId) }),
      ...(nome && { nome: { contains: nome, mode: "insensitive" as const } }),
    };

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: { select: { id: true, nome: true } },
          marca: { select: { id: true, nome: true } },
          certificados: { include: { certificado: true } },
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: { id: "asc" },
      }),
      prisma.produto.count({ where }),
    ]);

    return { produtos, page, size, total };
  });
}

/**
 * Cria um novo produto.
 * Requer autenticação ADMIN.
 *
 * @param data - Dados do produto (nome, preco, categoriaId, marcaId, descricao opcional)
 * @returns Produto recém-criado com categorias e marca incluídas
 */
export async function criarProduto(data: ProdutoInput) {
  const produto = await prisma.produto.create({
    data,
    include: { categoria: true, marca: true },
  });

  await invalidarCache("PRODUTOS");
  return produto;
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
export async function buscarProduto(id: number) {
  return comCache(chaveProduto(id), TTL.ITEM, () =>
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
 * @param id - ID do produto a ser atualizado
 * @param data - Dados para atualização (todos opcionais)
 * @returns Produto atualizado com relacionamentos
 */
export async function atualizarProduto(
  id: number,
  data: AtualizarProdutoInput,
) {
  const produto = await prisma.produto.update({
    where: { id },
    data,
    include: { categoria: true, marca: true },
  });

  await Promise.all([
    invalidarChave(chaveProduto(id)),
    invalidarCache("PRODUTOS"),
  ]);
  return produto;
}

/**
 * Deleta um produto.
 * Requer autenticação ADMIN.
 *
 * NOTA: A deleção em cascata no schema do Prisma remove automaticamente
 * os registros relacionados em ProdutoCertificado.
 *
 * @param id - ID do produto a ser deletado
 * @throws Error P2025 se produto não existir
 */
export async function deletarProduto(id: number) {
  await prisma.produto.delete({ where: { id } });
  await Promise.all([
    invalidarChave(chaveProduto(id)),
    invalidarCache("PRODUTOS"),
  ]);
}
