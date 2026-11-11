// lib/ai/providers/gemini-chat.ts

/**
 * GOOGLE GEMINI - TEXT GENERATION
 *
 * Integration with the Google Gemini 2.0 Flash API for text generation.
 *
 * Gemini is used in two contexts:
 * 1. Sustainability analysis: generates texts about environmental impact,
 *    decomposition time, recyclability, etc. (EcoScan AI)
 * 2. Educational chat: conversation with users about sustainability
 *
 * Model used: gemini-2.0-flash
 * - Faster and cheaper than Pro
 * - Capable enough for text tasks
 *
 * Required environment variable:
 * - GEMINI_KEY: Google AI Studio API key
 *
 * Failures (REQ-CHAT-09, REQ-SCAN-05, REQ-SCAN-09): the call has a time limit and
 * any failure (network, timeout, error or invalid response) returns
 * `null`; the caller decides the fallback.
 *
 * The key goes in the `x-goog-api-key` header, never in the URL (URLs end up in
 * proxy and server logs) — REQ-CHAT-08.
 */

import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

export const GEMINI_MODEL = "gemini-2.0-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Default time limit (initial value, not measured: adjust with real data). */
const TIMEOUT_GEMINI_MS = 20_000;

/** Sample value that has appeared in development `.env` files: it is not a key. */
const PLACEHOLDER_KEY = "sua_chave";

/**
 * Reads the Gemini API key from the environment.
 * @returns API key, or an empty string if not configured
 */
function getGeminiKey(): string {
  return process.env.GEMINI_KEY ?? "";
}

/**
 * Tells whether a key is configured (missing or sample value = not configured).
 */
export function isGeminiConfigured(): boolean {
  const key = getGeminiKey();
  return key !== "" && key !== PLACEHOLDER_KEY;
}

/**
 * Optional configuration for text generation.
 */
export interface GeminiConfig {
  /** Controls creativity: 0 = deterministic, 1 = more creative */
  temperature?: number;
  /** Number of candidate words considered (diversity) */
  topK?: number;
  /** Nucleus sampling: keeps X% of the cumulative probability */
  topP?: number;
  /** Maximum number of tokens in the response */
  maxOutputTokens?: number;
}

/**
 * Call shared by both uses (plain text and conversation with history).
 * Never throws: any failure becomes `null`.
 */
async function generate(
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
    // Network, timeout or a response that is not JSON. Silent on purpose:
    // it does not expose internal details (nor the key) to the caller.
    return null;
  }
}

/**
 * Generates text using the Gemini model.
 *
 * @param prompt - Input text for the model
 * @param config - Optional settings (temperature, topK, etc.)
 * @param timeoutMs - Call time limit (default: module constant)
 * @returns Generated text, or null on failure
 *
 * @example
 * const response = await generateText("Explain what recycling is");
 * console.log(response); // "Recycling is the process of turning waste into..."
 *
 * @example
 * const response = await generateText(prompt, {
 *   temperature: 0.5, // less creative, more factual
 *   maxOutputTokens: 500
 * });
 */
export async function generateText(
  prompt: string,
  config?: GeminiConfig,
  timeoutMs: number = TIMEOUT_GEMINI_MS,
): Promise<string | null> {
  return generate([{ parts: [{ text: prompt }] }], config, timeoutMs);
}

/**
 * Generates the next reply of a conversation (Gemini API `contents` format).
 *
 * @param contents - Conversation turns (`{ role, parts: [{ text }] }`)
 * @returns Generated text, or null on failure
 */
export async function generateWithHistory(
  contents: unknown[],
  config?: GeminiConfig,
  timeoutMs: number = TIMEOUT_GEMINI_MS,
): Promise<string | null> {
  return generate(contents, config, timeoutMs);
}
