// lib/ai/fallbacks/sustentabilidade.ts

/**
 * ============================================================================
 * SUSTENTABILIDADE FALLBACK
 * ============================================================================
 * Análise genérica de sustentabilidade para quando a IA falha.
 *
 * Cenários de uso do fallback:
 * 1. Gemini retornou resposta inválida (não-JSON, campos faltando)
 * 2. API do Gemini está indisponível (rate limit, timeout, erro)
 * 3. Chave da API não configurada
 *
 * A análise genérica é segura e educativa, sem informações específicas
 * do material, mas ainda útil para o usuário.
 *
 * IMPORTANTE: O fallback NÃO substitui uma análise real, mas evita
 * que o usuário receba um erro vazio. É melhor que nada.
 * ============================================================================
 */

import type { AiAnalysis } from "@/types/ai";

/**
 * Gera uma análise genérica para um material.
 *
 * @param material - Nome do material (ex: "plastico", "vidro")
 * @returns Objeto AnaliseIA com textos genéricos
 *
 * @example
 * const analise = analiseBasica("plastico");
 * // Retorna análise sem dados específicos, mas com informações educativas
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
