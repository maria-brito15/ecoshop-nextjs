// lib/ai/analyze-image.ts

/**
 * ANALYZE IMAGE - MAIN ORCHESTRATION
 *
 * Main function orchestrating the whole EcoScan AI image analysis flow.
 *
 * Full flow:
 * 1. Classify the image with Azure Custom Vision
 * 2. If there is no prediction → return an error
 * 3. Select the prediction with the highest probability
 * 4. If confidence < threshold or tag = "outros" → return an error with a suggestion
 * 5. Build the Gemini prompt with the identified material
 * 6. Generate the sustainability analysis
 * 7. If generation fails → use the generic fallback
 * 8. Return the complete result to the frontend
 *
 * Environment configuration:
 * - AI_CONFIDENCE_THRESHOLD: minimum confidence (0.0 to 1.0, default: 0.7)
 *
 * IMPORTANT: The fallback (fallbackAnalysis) guarantees the user always gets
 * some answer, even when the AI fails.
 */

import { classifyImage } from "./providers/azure-vision";
import { generateText } from "./providers/gemini-chat";
import { buildSustainabilityPrompt } from "./prompts/sustainability";
import { parseAnalysis } from "./parsers/sustainability";
import { fallbackAnalysis } from "./fallbacks/sustainability";
import type { ScanResult } from "@/types/ai";

/**
 * Minimum confidence required to consider a prediction valid.
 * Percentage value: 0.7 = 70%
 *
 * If the best prediction has confidence below this value, the scan fails
 * and the user gets a suggestion to take a better photo.
 */
const MIN_CONFIDENCE = Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 0.7);

/**
 * Analyzes an image and returns information about the identified material.
 *
 * @param imageBuffer - Image buffer (binary format)
 * @param imageId - Unique ID generated for this analysis (e.g. "analise_123456_abc")
 * @returns Analysis result (success or failure)
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const result = await analyzeImage(Buffer.from(buffer), "analise_123");
 *
 * if (result.sucesso) {
 *   console.log(`Material: ${result.material}`);
 *   console.log(`Confidence: ${result.confianca}%`);
 *   console.log(result.analise_sustentabilidade.reciclabilidade);
 * } else {
 *   console.log(result.sugestao);
 * }
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  imageId: string,
): Promise<ScanResult> {
  const timestamp = new Date().toISOString();
  const predictions = await classifyImage(imageBuffer);

  // Case 1: no prediction returned (Azure failed)
  if (!predictions?.length) {
    return {
      sucesso: false,
      mensagem:
        "No prediction returned by the computer vision service.",
      confianca: 0,
      confianca_minima_requerida: MIN_CONFIDENCE * 100,
      material_provavel: "N/A",
      imageId,
      timestamp,
      sugestao:
        "Check that the Azure credentials are configured correctly.",
    };
  }

  // Find the prediction with the highest probability
  const best = predictions.reduce((a, b) =>
    a.probability > b.probability ? a : b,
  );

  // Case 2: low confidence OR material identified as "outros"
  if (best.probability < MIN_CONFIDENCE || best.tagName === "outros") {
    return {
      sucesso: false,
      mensagem:
        "Could not identify the object with enough confidence.",
      confianca: Math.round(best.probability * 10000) / 100,
      confianca_minima_requerida: MIN_CONFIDENCE * 100,
      material_provavel: best.tagName,
      imageId,
      timestamp,
      sugestao: "Try taking a closer photo with better lighting.",
    };
  }

  // Case 3: successful identification → generate the analysis with Gemini
  const prompt = buildSustainabilityPrompt(best.tagName);
  const rawText = await generateText(prompt);

  // Try to parse Gemini's JSON; if it fails, use the generic fallback
  const analysis = rawText
    ? (parseAnalysis(rawText) ?? fallbackAnalysis(best.tagName))
    : fallbackAnalysis(best.tagName);

  return {
    sucesso: true,
    material: best.tagName,
    confianca: Math.round(best.probability * 10000) / 100,
    imageId,
    timestamp,
    analise_sustentabilidade: analysis,
  };
}
