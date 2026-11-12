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
 * @param imageId - Unique ID generated for this analysis (e.g. "analysis_123456_abc")
 * @returns Analysis result (success or failure)
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const result = await analyzeImage(Buffer.from(buffer), "analysis_123");
 *
 * if (result.success) {
 *   console.log(`Material: ${result.material}`);
 *   console.log(`Confidence: ${result.confidence}%`);
 *   console.log(result.sustainability_analysis.recyclability);
 * } else {
 *   console.log(result.suggestion);
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
      success: false,
      message:
        "No prediction returned by the computer vision service.",
      confidence: 0,
      required_minimum_confidence: MIN_CONFIDENCE * 100,
      probable_material: "N/A",
      imageId,
      timestamp,
      suggestion:
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
      success: false,
      message:
        "Could not identify the object with enough confidence.",
      confidence: Math.round(best.probability * 10000) / 100,
      required_minimum_confidence: MIN_CONFIDENCE * 100,
      probable_material: best.tagName,
      imageId,
      timestamp,
      suggestion: "Try taking a closer photo with better lighting.",
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
    success: true,
    material: best.tagName,
    confidence: Math.round(best.probability * 10000) / 100,
    imageId,
    timestamp,
    sustainability_analysis: analysis,
  };
}
