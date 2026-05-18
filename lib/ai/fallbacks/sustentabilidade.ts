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

import type { AnaliseIA } from "@/types/ai";

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
export function analiseBasica(material: string): AnaliseIA {
  return {
    impacto_ambiental: `Material identificado como ${material}. A produção e descarte inadequado podem causar impactos ambientais significativos. É importante realizar o descarte correto para minimizar danos ao meio ambiente e permitir a reciclagem adequada.`,

    tempo_decomposicao: `O tempo de decomposição varia conforme as condições ambientais. Fatores como temperatura, umidade e exposição solar influenciam diretamente no processo de degradação natural.`,

    onde_descartar: `Descarte em pontos de coleta seletiva apropriados. Verifique com a prefeitura da sua cidade sobre Postos de Entrega Voluntária (PEVs) ou cooperativas de reciclagem próximas. Limpe o material antes de descartar.`,

    reciclabilidade: `A reciclabilidade deste material pode variar. Consulte especialistas locais em gestão de resíduos para informações detalhadas sobre o processo de reciclagem e suas limitações na sua região.`,

    dicas_sustentaveis: `Separe materiais recicláveis do lixo comum. Reduza o consumo sempre que possível. Procure alternativas reutilizáveis. Apoie empresas comprometidas com sustentabilidade e economia circular.`,

    beneficios_reciclagem: `A reciclagem reduz a necessidade de extração de recursos naturais, economiza energia, diminui emissões de gases de efeito estufa e gera empregos na cadeia de reciclagem.`,
  };
}
