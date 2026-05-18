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

export { analisarImagem } from "./analisar-imagem";
export { classificarImagem as classificarImagemAzure } from "./providers/azure-vision";
export { analiseBasica } from "./fallbacks/sustentabilidade";
export type { AnaliseIA, ResultadoScan } from "@/types/ai";
