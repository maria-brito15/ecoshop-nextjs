// lib/ai/providers/gemini-chat.ts

/**
 * ============================================================================
 * GOOGLE GEMINI - GERAÇÃO DE TEXTO
 * ============================================================================
 * Integração com a API do Google Gemini 2.0 Flash para geração de texto.
 *
 * O Gemini é utilizado em dois contextos:
 * 1. Análise de sustentabilidade: gera textos sobre impacto ambiental,
 *    tempo de decomposição, reciclabilidade, etc. (EcoScan IA)
 * 2. Chat educacional: conversa com usuários sobre sustentabilidade
 *
 * Modelo utilizado: gemini-2.0-flash
 * - Mais rápido e econômico que o Pro
 * - Suficientemente capaz para tarefas de texto
 *
 * Variável de ambiente necessária:
 * - GEMINI_KEY: Chave de API do Google AI Studio
 * ============================================================================
 */

export const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Recupera a chave da API Gemini do ambiente.
 * @returns Chave da API ou string vazia se não configurada
 */
function getGeminiKey(): string {
  return process.env.GEMINI_KEY ?? "";
}

/**
 * Configuração opcional para geração de texto.
 */
export interface GeminiConfig {
  /** Controla criatividade: 0 = determinístico, 1 = mais criativo */
  temperature?: number;
  /** Número de palavras candidatas consideradas (diversidade) */
  topK?: number;
  /** Nucleus sampling: mantém X% de probabilidade acumulada */
  topP?: number;
  /** Limite máximo de tokens na resposta */
  maxOutputTokens?: number;
}

/**
 * Gera texto usando o modelo Gemini.
 *
 * @param prompt - Texto de entrada para o modelo
 * @param config - Configurações opcionais (temperature, topK, etc.)
 * @returns Texto gerado ou null se falha
 *
 * @example
 * const resposta = await gerarTexto("Explique o que é reciclagem");
 * console.log(resposta); // "Reciclagem é o processo de transformar resíduos..."
 *
 * @example
 * const resposta = await gerarTexto(prompt, {
 *   temperature: 0.5, // menos criativo, mais factual
 *   maxOutputTokens: 500
 * });
 */
export async function gerarTexto(
  prompt: string,
  config?: GeminiConfig,
): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        topK: config?.topK ?? 40,
        topP: config?.topP ?? 0.95,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
