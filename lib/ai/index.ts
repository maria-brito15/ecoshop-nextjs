// lib/ai/index.ts

/**
 * ============================================================================
 * AI MODULE EXPORTS
 * ============================================================================
 * Ponto de entrada centralizado para todas as funcionalidades de IA.
 *
 * Este módulo exporta:
 * - Função principal analisarImagem (para o EcoScan IA)
 * - Função classificarImagemAzure (para testes/fallback)
 * - Função analiseBasica (fallback de sustentabilidade)
 * - Tipos relacionados (AnaliseIA, ResultadoScan)
 *
 * Padrão de exportação:
 * - Use `import { analisarImagem } from "@/lib/ai"` em vez de caminhos profundos
 * ============================================================================
 */

export { analyzeImage as analisarImagem } from "./analyze-image";
export { classifyImage as classificarImagemAzure } from "./providers/azure-vision";
export { fallbackAnalysis as analiseBasica } from "./fallbacks/sustainability";
export type { AiAnalysis as AnaliseIA, ScanResult as ResultadoScan } from "@/types/ai";
