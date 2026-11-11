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
 *
 * Falhas (REQ-CHAT-09, REQ-SCAN-05, REQ-SCAN-09): a chamada tem tempo limite e
 * qualquer falha (rede, tempo esgotado, resposta de erro ou inválida) devolve
 * `null`; quem chama decide a contingência.
 *
 * A chave vai no cabeçalho `x-goog-api-key`, nunca na URL (URLs acabam em logs
 * de proxy e de servidor) — REQ-CHAT-08.
 * ============================================================================
 */

import { fetchWithTimeout } from "@/lib/http/fetch-com-timeout";

export const GEMINI_MODEL = "gemini-2.0-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Tempo limite padrão (valor inicial, sem medição: ajustar com dados reais). */
const TIMEOUT_GEMINI_MS = 20_000;

/** Valor de exemplo que já apareceu em `.env` de desenvolvimento: não é uma chave. */
const PLACEHOLDER_KEY = "sua_chave";

/**
 * Recupera a chave da API Gemini do ambiente.
 * @returns Chave da API ou string vazia se não configurada
 */
function getGeminiKey(): string {
  return process.env.GEMINI_KEY ?? "";
}

/**
 * Indica se há uma chave configurada (ausente ou valor de exemplo = não configurada).
 */
export function isGeminiConfigured(): boolean {
  const key = getGeminiKey();
  return key !== "" && key !== PLACEHOLDER_KEY;
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
 * Chamada comum aos dois usos (texto simples e conversa com histórico).
 * Nunca lança: qualquer falha vira `null`.
 */
async function gerar(
  contents: unknown[],
  config: GeminiConfig | undefined,
  timeoutMs: number,
): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  try {
    const res = await fetchWithTimeout(
      GEMINI_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            topK: config?.topK ?? 40,
            topP: config?.topP ?? 0.95,
            maxOutputTokens: config?.maxOutputTokens ?? 2048,
          },
        }),
      },
      timeoutMs,
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    // Rede, tempo esgotado ou resposta que não é JSON. Silencioso de propósito:
    // não expõe detalhes internos (nem a chave) a quem chama.
    return null;
  }
}

/**
 * Gera texto usando o modelo Gemini.
 *
 * @param prompt - Texto de entrada para o modelo
 * @param config - Configurações opcionais (temperature, topK, etc.)
 * @param timeoutMs - Tempo limite da chamada (padrão: constante do módulo)
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
export async function generateText(
  prompt: string,
  config?: GeminiConfig,
  timeoutMs: number = TIMEOUT_GEMINI_MS,
): Promise<string | null> {
  return gerar([{ parts: [{ text: prompt }] }], config, timeoutMs);
}

/**
 * Gera a próxima resposta de uma conversa (formato de `contents` da API Gemini).
 *
 * @param contents - Turnos da conversa (`{ role, parts: [{ text }] }`)
 * @returns Texto gerado ou null se falha
 */
export async function generateWithHistory(
  contents: unknown[],
  config?: GeminiConfig,
  timeoutMs: number = TIMEOUT_GEMINI_MS,
): Promise<string | null> {
  return gerar(contents, config, timeoutMs);
}
