// lib/ai/index.ts

/**
 * AI MODULE EXPORTS
 *
 * Single entry point for all AI features.
 *
 * This module exports:
 * - Main function analyzeImage (for EcoScan AI)
 * - Function classifyImage (for tests/fallback)
 * - Function fallbackAnalysis (sustainability fallback)
 * - Related types (AiAnalysis, ScanResult)
 *
 * Export pattern:
 * - Use `import { analyzeImage } from "@/lib/ai"` instead of deep paths
 */

export { analyzeImage as analisarImagem } from "./analyze-image";
export { classifyImage as classificarImagemAzure } from "./providers/azure-vision";
export { fallbackAnalysis as analiseBasica } from "./fallbacks/sustainability";
export type { AiAnalysis as AnaliseIA, ScanResult as ResultadoScan } from "@/types/ai";
