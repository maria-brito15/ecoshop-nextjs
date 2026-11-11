// lib/ai/prompts/sustentabilidade.ts

/**
 * ============================================================================
 * SUSTENTABILIDADE PROMPT
 * ============================================================================
 * Prompt de sistema para o Gemini gerar análises de materiais recicláveis.
 *
 * Este prompt é usado pelo EcoScan IA após a identificação do material.
 * O Gemini recebe o nome do material (ex: "plastico", "vidro", "papelao")
 * e deve retornar um JSON estruturado com informações de sustentabilidade.
 *
 * Estrutura do prompt:
 * 1. Definição do papel do especialista
 * 2. Lista de campos obrigatórios com descrições detalhadas
 * 3. Regras de formatação (JSON puro, sem markdown)
 * 4. Exemplo de formato esperado
 *
 * IMPORTANTE: O prompt é projetado para gerar JSON válido e completo.
 * O parser (parsearAnalise) extrai e valida o JSON da resposta.
 * ============================================================================
 */

/**
 * Monta o prompt completo para análise de um material.
 *
 * @param material - Nome do material identificado (ex: "plastico", "vidro")
 * @returns Prompt formatado para enviar ao Gemini
 *
 * @example
 * const prompt = montarPromptSustentabilidade("plastico");
 * const resposta = await gerarTexto(prompt);
 * const analise = parsearAnalise(resposta);
 */
export function buildSustainabilityPrompt(material: string): string {
  return `
You are a renowned expert in environmental sustainability and ecology, with deep knowledge of waste management and the circular economy. Analyze the following recyclable material in detail: ${material}

Provide a COMPLETE analysis in JSON format with the following fields:

1. impacto_ambiental: Impacts of production and incorrect disposal, consequences for fauna and flora, statistical data. (4-5 sentences)
2. tempo_decomposicao: Exact decomposition time in nature, factors that affect it, comparison with other materials.
3. onde_descartar: Specific bin color, preparation before disposal, alternative locations, what NOT to do.
4. reciclabilidade: High/Medium/Low level, percentage in Brazil and worldwide, summarized process, limitations.
5. dicas_sustentaveis: 4-5 practical tips on reduction, reuse and sustainable alternatives.
6. beneficios_reciclagem: Resource savings (with numbers), CO2 reduction, job creation.

RULES:
- Answer ONLY with a valid JSON object, without markdown and without extra text.
- Use \\n for line breaks inside the strings.
- Focus on the Brazilian context.

FORMAT: {"impacto_ambiental":"...","tempo_decomposicao":"...","onde_descartar":"...","reciclabilidade":"...","dicas_sustentaveis":"...","beneficios_reciclagem":"..."}
`.trim();
}
