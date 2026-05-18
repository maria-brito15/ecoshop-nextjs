// lib/ai/parsers/sustentabilidade.ts

/**
 * ============================================================================
 * SUSTENTABILIDADE PARSER
 * ============================================================================
 * Parser para extrair e validar JSON da resposta do Gemini.
 *
 * O Gemini pode retornar a resposta em diferentes formatos:
 * - JSON puro: {"impacto_ambiental": "..."}
 * - JSON com markdown: ```json {...} ```
 * - JSON com texto antes/depois
 *
 * Este módulo:
 * 1. Limpa a resposta removendo markdown
 * 2. Extrai o primeiro objeto JSON encontrado
 * 3. Valida se todos os campos obrigatórios estão presentes
 *
 * Fallback: se falhar, retorna null e o código chamador usa analiseBasica()
 * ============================================================================
 */

import type { AnaliseIA } from "@/types/ai";

/**
 * Campos obrigatórios que devem estar presentes na análise.
 * Se algum campo estiver faltando ou vazio, a análise é rejeitada.
 */
const CAMPOS_OBRIGATORIOS: (keyof AnaliseIA)[] = [
  "impacto_ambiental",
  "tempo_decomposicao",
  "onde_descartar",
  "reciclabilidade",
  "dicas_sustentaveis",
  "beneficios_reciclagem",
];

/**
 * Extrai e valida o JSON da resposta do Gemini.
 *
 * Algoritmo:
 * 1. Remove blocos de código markdown (```json ... ```)
 * 2. Encontra a posição do primeiro '{' e último '}'
 * 3. Faz parse do JSON entre essas posições
 * 4. Valida se todos os campos obrigatórios são strings não vazias
 *
 * @param textoRaw - Texto bruto retornado pelo Gemini
 * @returns Objeto AnaliseIA válido ou null se falha
 *
 * @example
 * const resposta = await gerarTexto(prompt);
 * const analise = parsearAnalise(resposta);
 * if (analise) {
 *   console.log(analise.impacto_ambiental);
 * }
 */
export function parsearAnalise(textoRaw: string): AnaliseIA | null {
  try {
    // Passo 1: Remove blocos de código markdown
    const limpo = textoRaw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Passo 2: Encontra o primeiro '{' e último '}'
    const inicio = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (inicio === -1 || fim === -1) return null;

    // Passo 3: Parse do JSON
    const parsed = JSON.parse(limpo.slice(inicio, fim + 1));

    // Passo 4: Validação dos campos obrigatórios
    const valido = CAMPOS_OBRIGATORIOS.every(
      (campo) =>
        typeof parsed[campo] === "string" && parsed[campo].trim().length > 0,
    );

    return valido ? (parsed as AnaliseIA) : null;
  } catch {
    // JSON inválido (malformado, campos ausentes, tipo incorreto)
    return null;
  }
}

export type { AnaliseIA };
