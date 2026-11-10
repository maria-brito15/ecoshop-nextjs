// lib/schemas/produto.ts

/**
 * ============================================================================
 * PRODUTO SCHEMAS (Zod)
 * ============================================================================
 * Schemas de validação para operações CRUD de produtos.
 *
 * Produtos são o core da plataforma — representam itens sustentáveis à venda.
 *
 * Regras de negócio:
 * - Preço deve ser positivo (maior que zero)
 * - Categoria e Marca são obrigatórias (chaves estrangeiras)
 * - Nome é obrigatório e deve ser único (validação no banco via Prisma)
 *
 * Endpoints que usam estes schemas:
 * - POST /api/produtos
 * - PUT /api/produtos/:id
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema para criação de um novo produto.
 *
 * Regras:
 * - nome: obrigatório, não vazio
 * - descricao: opcional, mínimo 1 caractere se fornecida
 * - preco: obrigatório, número positivo (maior que 0)
 * - categoriaId: obrigatório, inteiro positivo
 * - marcaId: obrigatório, inteiro positivo
 *
 * VALIDAÇÕES ADICIONAIS (no service):
 * - Verificar se categoriaId existe no banco
 * - Verificar se marcaId existe no banco
 * - Verificar se nome é único (não existe outro produto com mesmo nome)
 *
 * @example
 * const dados = {
 *   nome: "Camiseta Básica Orgânica",
 *   descricao: "100% algodão orgânico, tingimento natural",
 *   preco: 89.90,
 *   categoriaId: 1,
 *   marcaId: 2
 * };
 */
export const produtoSchema = z.object({
  nome: z.string().min(1, "Nome do produto é obrigatório"),
  descricao: z
    .string()
    .min(1, "Descrição deve ter pelo menos 1 caractere")
    .optional(),
  preco: z.number().positive("Preço deve ser maior que zero"),
  categoriaId: z.number().int("ID da categoria deve ser um número inteiro"),
  marcaId: z.number().int("ID da marca deve ser um número inteiro"),
});

/**
 * Schema para atualização de um produto existente.
 *
 * TODOS os campos são opcionais — permite atualização parcial.
 * O admin pode atualizar apenas os campos que desejar.
 *
 * Regras (quando presentes):
 * - nome: mínimo 1 caractere
 * - descricao: mínimo 1 caractere
 * - preco: positivo (maior que 0)
 * - categoriaId: inteiro positivo
 * - marcaId: inteiro positivo
 *
 * @example
 * // Aumentar preço em 10%
 * const dados = { preco: 98.89 };
 *
 * // Atualizar apenas descrição
 * const dados = { descricao: "Camiseta orgânica com certificado FSC" };
 *
 * // Mudar categoria do produto
 * const dados = { categoriaId: 3 };
 */
export const atualizarProdutoSchema = z.object({
  nome: z.string().min(1, "Nome não pode estar vazio").optional(),
  descricao: z.string().min(1, "Descrição não pode estar vazia").optional(),
  preco: z.number().positive("Preço deve ser maior que zero").optional(),
  categoriaId: z
    .number()
    .int("ID da categoria deve ser um número inteiro")
    .optional(),
  marcaId: z.number().int("ID da marca deve ser um número inteiro").optional(),
});

/**
 * Schema de validação dos parâmetros de query de GET /api/produtos.
 *
 * REQ-CAT-05: page e size inválidos, ou size acima de 100, respondem 400
 * em vez de serem aceitos silenciosamente (antes, `Number(...)` de um valor
 * inválido virava NaN e seguia para o Prisma sem checagem).
 *
 * Usa `coerce` porque searchParams só entrega strings.
 */
export const listarProdutosQuerySchema = z.object({
  page: z.coerce
    .number({ message: "page deve ser um número" })
    .int("page deve ser um número inteiro")
    .min(1, "page deve ser pelo menos 1")
    .optional()
    .default(1),
  size: z.coerce
    .number({ message: "size deve ser um número" })
    .int("size deve ser um número inteiro")
    .min(1, "size deve ser pelo menos 1")
    .max(100, "size não pode passar de 100")
    .optional()
    .default(12),
  categoriaId: z.coerce
    .number()
    .int()
    .optional(),
  nome: z.string().optional(),
});

// Tipos inferidos para uso nos services
export type ProdutoInput = z.infer<typeof produtoSchema>;
export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;
