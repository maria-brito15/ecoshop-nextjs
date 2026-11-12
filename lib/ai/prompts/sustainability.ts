// lib/ai/prompts/sustainability.ts

/**
 * SUSTAINABILITY PROMPT
 *
 * System prompt for Gemini to generate analyses of recyclable materials.
 *
 * This prompt is used by EcoScan AI after the material is identified.
 * Gemini receives the material name (e.g. "plastico", "vidro", "papelao")
 * and must return structured JSON with sustainability information.
 *
 * Prompt structure:
 * 1. Definition of the expert role
 * 2. List of required fields with detailed descriptions
 * 3. Formatting rules (plain JSON, no markdown)
 * 4. Example of the expected format
 *
 * IMPORTANT: The prompt is designed to produce valid and complete JSON.
 * The parser (parseAnalysis) extracts and validates the JSON from the response.
 */

/**
 * Builds the complete prompt to analyze a material.
 *
 * @param material - Name of the identified material (e.g. "plastico", "vidro")
 * @returns Formatted prompt to send to Gemini
 *
 * @example
 * const prompt = buildSustainabilityPrompt("plastico");
 * const response = await generateText(prompt);
 * const analysis = parseAnalysis(response);
 */
export function buildSustainabilityPrompt(material: string): string {
  return `
You are a renowned expert in environmental sustainability and ecology, with deep knowledge of waste management and the circular economy. Analyze the following recyclable material in detail: ${material}

Provide a COMPLETE analysis in JSON format with the following fields:

1. environmental_impact: Impacts of production and incorrect disposal, consequences for fauna and flora, statistical data. (4-5 sentences)
2. decomposition_time: Exact decomposition time in nature, factors that affect it, comparison with other materials.
3. disposal_instructions: Specific bin color, preparation before disposal, alternative locations, what NOT to do.
4. recyclability: High/Medium/Low level, percentage in Brazil and worldwide, summarized process, limitations.
5. sustainable_tips: 4-5 practical tips on reduction, reuse and sustainable alternatives.
6. recycling_benefits: Resource savings (with numbers), CO2 reduction, job creation.

RULES:
- Answer ONLY with a valid JSON object, without markdown and without extra text.
- Use \\n for line breaks inside the strings.
- Focus on the Brazilian context.

FORMAT: {"environmental_impact":"...","decomposition_time":"...","disposal_instructions":"...","recyclability":"...","sustainable_tips":"...","recycling_benefits":"..."}
`.trim();
}
