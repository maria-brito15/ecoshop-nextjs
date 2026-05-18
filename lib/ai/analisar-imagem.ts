// lib/ai/analisar-imagem.ts

/**
 * ============================================================================
 * ANALISAR IMAGEM - ORQUESTRAÇÃO PRINCIPAL
 * ============================================================================
 * Função principal que orquestra todo o fluxo de análise de imagem do EcoScan IA.
 *
 * Fluxo completo:
 * 1. Classifica a imagem com Azure Custom Vision
 * 2. Se nenhuma predição → retorna erro
 * 3. Seleciona a predição com maior probabilidade
 * 4. Se confiança < threshold ou tag = "outros" → retorna erro com sugestão
 * 5. Monta prompt para Gemini com o material identificado
 * 6. Gera análise de sustentabilidade
 * 7. Se falha na geração → usa fallback genérico
 * 8. Retorna resultado completo para o frontend
 *
 * Configuração via ambiente:
 * - AI_CONFIDENCE_THRESHOLD: confiança mínima (0.0 a 1.0, padrão: 0.7)
 *
 * IMPORTANTE: O fallback (analiseBasica) garante que o usuário sempre receba
 * alguma resposta, mesmo quando a IA falha.
 * ============================================================================
 */

import { classificarImagem } from "./providers/azure-vision";
import { gerarTexto } from "./providers/gemini-chat";
import { montarPromptSustentabilidade } from "./prompts/sustentabilidade";
import { parsearAnalise } from "./parsers/sustentabilidade";
import { analiseBasica } from "./fallbacks/sustentabilidade";
import type { ResultadoScan } from "@/types/ai";

/**
 * Confiança mínima exigida para considerar uma predição válida.
 * Valor percentual: 0.7 = 70%
 *
 * Se a melhor predição tiver confiança abaixo deste valor, o scan falha
 * e o usuário recebe uma sugestão para tirar uma foto melhor.
 */
const CONFIANCA_MINIMA = Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 0.7);

/**
 * Analisa uma imagem e retorna informações sobre o material identificado.
 *
 * @param imageBuffer - Buffer da imagem (formato binário)
 * @param imageId - ID único gerado para esta análise (ex: "analise_123456_abc")
 * @returns Resultado da análise (sucesso ou falha)
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const resultado = await analisarImagem(Buffer.from(buffer), "analise_123");
 *
 * if (resultado.sucesso) {
 *   console.log(`Material: ${resultado.material}`);
 *   console.log(`Confiança: ${resultado.confianca}%`);
 *   console.log(resultado.analise_sustentabilidade.reciclabilidade);
 * } else {
 *   console.log(resultado.sugestao);
 * }
 */
export async function analisarImagem(
  imageBuffer: Buffer,
  imageId: string,
): Promise<ResultadoScan> {
  const timestamp = new Date().toISOString();
  const predicoes = await classificarImagem(imageBuffer);

  // Caso 1: Nenhuma predição retornada (Azure falhou)
  if (!predicoes?.length) {
    return {
      sucesso: false,
      mensagem:
        "Nenhuma predição retornada pelo serviço de visão computacional.",
      confianca: 0,
      confianca_minima_requerida: CONFIANCA_MINIMA * 100,
      material_provavel: "N/A",
      imageId,
      timestamp,
      sugestao:
        "Verifique se as credenciais Azure estão configuradas corretamente.",
    };
  }

  // Encontra a predição com maior probabilidade
  const melhor = predicoes.reduce((a, b) =>
    a.probability > b.probability ? a : b,
  );

  // Caso 2: Confiança baixa OU material identificado como "outros"
  if (melhor.probability < CONFIANCA_MINIMA || melhor.tagName === "outros") {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível identificar o objeto com confiança suficiente.",
      confianca: Math.round(melhor.probability * 10000) / 100,
      confianca_minima_requerida: CONFIANCA_MINIMA * 100,
      material_provavel: melhor.tagName,
      imageId,
      timestamp,
      sugestao: "Tente tirar uma foto mais próxima e com melhor iluminação.",
    };
  }

  // Caso 3: Identificação bem-sucedida → gera análise com Gemini
  const prompt = montarPromptSustentabilidade(melhor.tagName);
  const textoRaw = await gerarTexto(prompt);

  // Tenta parsear JSON do Gemini, se falhar usa fallback genérico
  const analise = textoRaw
    ? (parsearAnalise(textoRaw) ?? analiseBasica(melhor.tagName))
    : analiseBasica(melhor.tagName);

  return {
    sucesso: true,
    material: melhor.tagName,
    confianca: Math.round(melhor.probability * 10000) / 100,
    imageId,
    timestamp,
    analise_sustentabilidade: analise,
  };
}
