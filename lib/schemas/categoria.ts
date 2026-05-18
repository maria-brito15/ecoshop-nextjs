// lib/schemas/categoria.ts

/**
 * ============================================================================
 * CATEGORIA SCHEMAS (Zod)
 * ============================================================================
 * Schemas de validação para operações CRUD de categorias.
 *
 * Categorias organizam produtos em grupos como:
 * - Roupas Sustentáveis
 * - Alimentos Orgânicos
 * - Cosméticos Naturais
 * - Casa e Decoração
 * - Calçados Ecológicos
 *
 * Regras de negócio:
 * - Nome da categoria é único no sistema (validação no banco via Prisma)
 * - Descrição é opcional
 * - Categorias com produtos associados não podem ser deletadas
 *
 * Endpoints que usam estes schemas:
 * - POST /api/categorias
 * - PUT /api/categorias/:id
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema para criação de uma nova categoria.
 *
 * Regras:
 * - nome: obrigatório, não vazio (trim automático)
 * - descricao: opcional (se fornecida, será trimada)
 *
 * @example
 * const dados = {
 *   nome: "Eletrônicos Sustentáveis",
 *   descricao: "Dispositivos com baixo consumo energético"
 * };
 */
export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome da categoria é obrigatório"),
  descricao: z.string().optional(),
});

/**
 * Schema para atualização de uma categoria existente.
 *
 * TODOS os campos são opcionais — permite atualização parcial.
 * Útil para PATCH operations onde apenas um campo precisa ser alterado.
 *
 * Regras:
 * - nome: mínimo 1 caractere SE fornecido
 * - descricao: string livre SE fornecida
 *
 * @example
 * // Renomear categoria
 * const dados = { nome: "Moda Sustentável" };
 *
 * // Atualizar apenas descrição
 * const dados = { descricao: "Vestuário ético e ecológico" };
 */
export const atualizarCategoriaSchema = z.object({
  nome: z.string().min(1, "Nome não pode estar vazio").optional(),
  descricao: z.string().optional(),
});

// Tipos inferidos para uso nos services
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type AtualizarCategoriaInput = z.infer<typeof atualizarCategoriaSchema>;
