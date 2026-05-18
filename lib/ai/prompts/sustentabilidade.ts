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
export function montarPromptSustentabilidade(material: string): string {
  return `
Você é um especialista renomado em sustentabilidade ambiental e ecologia, com profundo conhecimento sobre gestão de resíduos e economia circular. Analise detalhadamente o seguinte material de reciclagem: ${material}

Forneça uma análise COMPLETA em formato JSON com os seguintes campos:

1. impacto_ambiental: Impactos da produção e descarte incorreto, consequências na fauna e flora, dados estatísticos. (4-5 frases)
2. tempo_decomposicao: Tempo exato de decomposição na natureza, fatores que afetam, comparação com outros materiais.
3. onde_descartar: Cor da lixeira específica, preparação antes do descarte, locais alternativos, o que NÃO fazer.
4. reciclabilidade: Nível Alto/Médio/Baixo, percentual no Brasil e no mundo, processo resumido, limitações.
5. dicas_sustentaveis: 4-5 dicas práticas de redução, reutilização e alternativas sustentáveis.
6. beneficios_reciclagem: Economia de recursos (com números), redução de CO2, geração de empregos.

REGRAS:
- Responda APENAS com um objeto JSON válido, sem markdown, sem texto extra.
- Use \\n para quebras de linha dentro das strings.
- Foque no contexto brasileiro.

FORMATO: {"impacto_ambiental":"...","tempo_decomposicao":"...","onde_descartar":"...","reciclabilidade":"...","dicas_sustentaveis":"...","beneficios_reciclagem":"..."}
`.trim();
}
