// lib/schemas/marca.ts

/**
 * ============================================================================
 * MARCA SCHEMAS (Zod)
 * ============================================================================
 * Schemas de validação para operações CRUD de marcas.
 *
 * Marcas representam fabricantes/empresas parceiras da EcoShop.
 * Exemplos: "EcoBrand", "Pureza Naturais", "Bambu Home".
 *
 * Regras de negócio:
 * - Nome da marca é único no sistema
 * - Cada marca é associada a um usuário (relacionamento 1:1)
 * - Apenas usuários do tipo MARCA ou ADMIN podem ser responsáveis por marcas
 *
 * Endpoints que usam estes schemas:
 * - POST /api/marcas
 * - PUT /api/marcas/:id
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema para criação de uma nova marca.
 *
 * Regras:
 * - nome: obrigatório, não vazio (ex: "EcoBrand")
 * - descricao: opcional — história ou compromissos da marca
 * - usuarioId: obrigatório, inteiro positivo (ID do usuário responsável)
 *
 * VALIDAÇÃO ADICIONAL (no service):
 * - Verificar se o usuário existe
 * - Verificar se o usuário não já está associado a outra marca (unicidade)
 * - Verificar se o tipo do usuário é MARCA ou ADMIN
 *
 * @example
 * const dados = {
 *   nome: "EcoBrand",
 *   descricao: "Roupas sustentáveis feitas com algodão orgânico",
 *   usuarioId: 5
 * };
 */
export const marcaSchema = z.object({
  nome: z.string().min(1, "Nome da marca é obrigatório"),
  descricao: z.string().optional(),
  usuarioId: z.number().int("ID do usuário deve ser um número inteiro"),
});

/**
 * Schema para atualização de uma marca existente.
 *
 * TODOS os campos são opcionais — permite atualização parcial.
 * NOTA: usuarioId NÃO pode ser alterado após a criação.
 * Para transferir responsabilidade, um admin deve criar uma nova marca.
 *
 * Regras:
 * - nome: mínimo 1 caractere SE fornecido
 * - descricao: string livre SE fornecida
 *
 * @example
 * // Renomear marca
 * const dados = { nome: "EcoBrand Sustentável" };
 *
 * // Atualizar apenas descrição
 * const dados = { descricao: "Nova coleção 2026 com tecidos reciclados" };
 */
export const atualizarMarcaSchema = z.object({
  nome: z.string().min(1, "Nome não pode estar vazio").optional(),
  descricao: z.string().optional(),
});

// Tipos inferidos para uso nos services
export type MarcaInput = z.infer<typeof marcaSchema>;
export type AtualizarMarcaInput = z.infer<typeof atualizarMarcaSchema>;
