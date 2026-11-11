// lib/schemas/product.ts

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
export const productSchema = z.object({
  nome: z.string().min(1, "Product name is required"),
  descricao: z
    .string()
    .min(1, "Description must have at least 1 character")
    .optional(),
  preco: z.number().positive("Price must be greater than zero"),
  categoriaId: z.number().int("Category ID must be an integer"),
  marcaId: z.number().int("Brand ID must be an integer"),
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
 * - certificadoIds: lista completa dos certificados vinculados (REQ-PROD-05);
 *   substitui o vínculo atual — enviar `[]` remove todos os certificados
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
 *
 * // Vincular dois certificados (substitui o vínculo anterior)
 * const dados = { certificadoIds: [1, 2] };
 */
export const updateProductSchema = z.object({
  nome: z.string().min(1, "Name cannot be empty").optional(),
  descricao: z.string().min(1, "Description cannot be empty").optional(),
  preco: z.number().positive("Price must be greater than zero").optional(),
  categoriaId: z
    .number()
    .int("Category ID must be an integer")
    .optional(),
  marcaId: z.number().int("Brand ID must be an integer").optional(),
  certificadoIds: z
    .array(z.number().int("Certificate ID must be an integer"))
    .optional(),
});

/**
 * Schema de validação dos parâmetros de query de GET /api/produtos.
 *
 * REQ-CAT-05: page e size inválidos, ou size acima de 100, respondem 400
 * em vez de serem aceitos silenciosamente (antes, `Number(...)` de um valor
 * inválido virava NaN e seguia para o Prisma sem checagem).
 *
 * REQ-CAT-06/07: `marcaId` filtra por marca; `precoMax` limita o preço; `sort`
 * ordena — todos aplicados pelo banco (Prisma `where`/`orderBy`), por isso
 * valem para o catálogo inteiro, não só para a página devolvida.
 *
 * Usa `coerce` porque searchParams só entrega strings.
 */
export const listProductsQuerySchema = z.object({
  page: z.coerce
    .number({ message: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .optional()
    .default(1),
  size: z.coerce
    .number({ message: "size must be a number" })
    .int("size must be an integer")
    .min(1, "size must be at least 1")
    .max(100, "size cannot exceed 100")
    .optional()
    .default(12),
  categoriaId: z.coerce
    .number()
    .int()
    .optional(),
  marcaId: z.coerce
    .number({ message: "marcaId must be a number" })
    .int("marcaId must be an integer")
    .optional(),
  precoMax: z.coerce
    .number({ message: "precoMax must be a number" })
    .positive("precoMax must be greater than zero")
    .optional(),
  sort: z
    .enum(["relevancia", "preco_asc", "preco_desc", "nome_asc", "nome_desc"], {
      message: "invalid sort",
    })
    .optional()
    .default("relevancia"),
  // REQ-CAT-10: limite de tamanho (a busca por nome entra na chave de cache);
  // texto vazio equivale a "sem filtro por nome".
  nome: z
    .string()
    .trim()
    .max(100, "nome cannot exceed 100 characters")
    .optional()
    .transform((value) => value || undefined),
});

// Tipos inferidos para uso nos services
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
