// lib/ai/fallbacks/sustainability.ts

/**
 * SUSTAINABILITY FALLBACK
 *
 * Generic sustainability analysis for when the AI fails.
 *
 * When the fallback is used:
 * 1. Gemini returned an invalid response (non-JSON, missing fields)
 * 2. The Gemini API is unavailable (rate limit, timeout, error)
 * 3. API key not configured
 *
 * The generic analysis is safe and educational, without material-specific
 * information, but still useful to the user.
 *
 * IMPORTANT: The fallback does NOT replace a real analysis, but it keeps
 * the user from getting an empty error. It is better than nothing.
 */

import type { AiAnalysis } from "@/types/ai";

/**
 * Generates a generic analysis for a material.
 *
 * @param material - Material name (e.g. "plastico", "vidro")
 * @returns AiAnalysis object with generic texts
 *
 * @example
 * const analysis = fallbackAnalysis("plastico");
 * // Returns an analysis without specific data, but with educational information
 */
export function fallbackAnalysis(material: string): AiAnalysis {
  return {
    impacto_ambiental: `Material identified as ${material}. Production and improper disposal can cause significant environmental impacts. It is important to dispose of it correctly to minimize harm to the environment and allow proper recycling.`,

    tempo_decomposicao: `Decomposition time varies with environmental conditions. Factors such as temperature, humidity and sun exposure directly influence the natural degradation process.`,

    onde_descartar: `Dispose of it at appropriate selective collection points. Check with your city hall about voluntary drop-off points or nearby recycling cooperatives. Clean the material before disposing of it.`,

    reciclabilidade: `The recyclability of this material may vary. Consult local waste management experts for detailed information about the recycling process and its limitations in your region.`,

    dicas_sustentaveis: `Separate recyclable materials from regular trash. Reduce consumption whenever possible. Look for reusable alternatives. Support companies committed to sustainability and the circular economy.`,

    beneficios_reciclagem: `Recycling reduces the need to extract natural resources, saves energy, lowers greenhouse gas emissions and creates jobs in the recycling chain.`,
  };
}
