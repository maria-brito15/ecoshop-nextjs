// lib/schemas/certificado.ts

/**
 * ============================================================================
 * CERTIFICADO SCHEMAS (Zod)
 * ============================================================================
 * Schemas de validação para operações CRUD de certificados de sustentabilidade.
 *
 * Certificados são selos que atestam que um produto atende a padrões ambientais.
 * Exemplos reais:
 * - Cruelty Free (PETA) → não testado em animais
 * - Orgânico Brasil (SisOrg) → produtos orgânicos certificados
 * - FSC (Forest Stewardship Council) → manejo florestal responsável
 * - Eureciclo → compensação ambiental de embalagens
 *
 * Regras de negócio:
 * - Nome do certificado é único no sistema
 * - Órgão emissor é obrigatório (ex: "PETA", "SisOrg", "FSC")
 * - Descrição é opcional
 *
 * Endpoints que usam estes schemas:
 * - POST /api/certificados
 * - PUT /api/certificados/:id
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema para criação de um novo certificado.
 *
 * Regras:
 * - nome: obrigatório, não vazio (ex: "Cruelty Free", "Orgânico Brasil")
 * - descricao: opcional — detalhamento do que o selo garante
 * - orgaoEmissor: obrigatório, não vazio (entidade responsável pela certificação)
 *
 * @example
 * const dados = {
 *   nome: "Cruelty Free",
 *   descricao: "Garante que o produto não foi testado em animais",
 *   orgaoEmissor: "PETA"
 * };
 */
export const certificadoSchema = z.object({
  nome: z.string().min(1, "Nome do certificado é obrigatório"),
  descricao: z.string().optional(),
  orgaoEmissor: z.string().min(1, "Órgão emissor é obrigatório"),
});

/**
 * Schema para atualização de um certificado existente.
 *
 * TODOS os campos são opcionais — permite atualização parcial.
 * Útil para corrigir apenas um campo sem precisar enviar todos.
 *
 * Regras (quando presentes):
 * - nome: mínimo 1 caractere
 * - descricao: string livre
 * - orgaoEmissor: mínimo 1 caractere
 *
 * @example
 * // Corrigir órgão emissor
 * const dados = { orgaoEmissor: "Instituto IBD" };
 *
 * // Atualizar apenas descrição
 * const dados = { descricao: "Certificação internacional de produtos orgânicos" };
 */
export const atualizarCertificadoSchema = z.object({
  nome: z.string().min(1, "Nome não pode estar vazio").optional(),
  descricao: z.string().optional(),
  orgaoEmissor: z
    .string()
    .min(1, "Órgão emissor não pode estar vazio")
    .optional(),
});

// Tipos inferidos para uso nos services
export type CertificadoInput = z.infer<typeof certificadoSchema>;
export type AtualizarCertificadoInput = z.infer<
  typeof atualizarCertificadoSchema
>;
