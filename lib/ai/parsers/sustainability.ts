// lib/ai/parsers/sustainability.ts

/**
 * SUSTAINABILITY PARSER
 *
 * Parser that extracts and validates the JSON from Gemini's response.
 *
 * Gemini may return the response in different formats:
 * - Plain JSON: {"environmental_impact": "..."}
 * - JSON with markdown: ```json {...} ```
 * - JSON with text before/after
 *
 * This module:
 * 1. Cleans the response by removing markdown
 * 2. Extracts the first JSON object found
 * 3. Validates that all required fields are present
 *
 * Fallback: if it fails, it returns null and the caller uses fallbackAnalysis()
 */

import type { AiAnalysis } from "@/types/ai";

/**
 * Required fields that must be present in the analysis.
 * If any field is missing or empty, the analysis is rejected.
 */
const REQUIRED_FIELDS: (keyof AiAnalysis)[] = [
  "environmental_impact",
  "decomposition_time",
  "disposal_instructions",
  "recyclability",
  "sustainable_tips",
  "recycling_benefits",
];

/**
 * Extracts and validates the JSON from Gemini's response.
 *
 * Algorithm:
 * 1. Removes markdown code blocks (```json ... ```)
 * 2. Finds the position of the first '{' and the last '}'
 * 3. Parses the JSON between those positions
 * 4. Validates that all required fields are non-empty strings
 *
 * @param rawText - Raw text returned by Gemini
 * @returns Valid AiAnalysis object, or null on failure
 *
 * @example
 * const response = await generateText(prompt);
 * const analysis = parseAnalysis(response);
 * if (analysis) {
 *   console.log(analysis.environmental_impact);
 * }
 */
export function parseAnalysis(rawText: string): AiAnalysis | null {
  try {
    // Step 1: remove markdown code blocks
    const clean = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // Step 2: find the first '{' and the last '}'
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) return null;

    // Step 3: parse the JSON
    const parsed = JSON.parse(clean.slice(start, end + 1));

    // Step 4: validate the required fields
    const valid = REQUIRED_FIELDS.every(
      (field) =>
        typeof parsed[field] === "string" && parsed[field].trim().length > 0,
    );

    return valid ? (parsed as AiAnalysis) : null;
  } catch {
    // Invalid JSON (malformed, missing fields, wrong type)
    return null;
  }
}

export type { AiAnalysis as AiAnalysis };
