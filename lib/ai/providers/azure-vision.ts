// lib/ai/providers/azure-vision.ts

/**
 * ============================================================================
 * AZURE CUSTOM VISION - CLASSIFICAÇÃO DE IMAGENS
 * ============================================================================
 * Integração com o Azure Custom Vision para classificação de materiais recicláveis.
 *
 * O Azure Custom Vision é um serviço de IA que permite treinar modelos
 * personalizados para classificação de imagens. Neste projeto, ele identifica
 * materiais como: plástico, vidro, papel, metal, orgânico, etc.
 *
 * Fluxo:
 * 1. Recebe buffer da imagem enviada pelo usuário
 * 2. Envia para o endpoint de predição do Azure
 * 3. Retorna array de tags com probabilidades
 *
 * IMPORTANTE: O modelo deve ser treinado previamente no portal do Azure.
 * As tags reconhecidas devem incluir "outros" para fallback.
 *
 * Variáveis de ambiente necessárias:
 * - AZURE_VISION_ENDPOINT: URL do endpoint de predição
 * - AZURE_VISION_KEY: Chave de acesso à API
 * ============================================================================
 */

const AZURE_URL = process.env.AZURE_VISION_ENDPOINT ?? "";
const AZURE_KEY = process.env.AZURE_VISION_KEY ?? "";

/**
 * Predição retornada pelo Azure Custom Vision.
 */
export interface AzurePrediction {
  /** Nome da tag/material identificado (ex: "plastico", "vidro", "papel") */
  tagName: string;
  /** Probabilidade/confiança da predição (0 a 1) */
  probability: number;
}

/**
 * Classifica uma imagem usando Azure Custom Vision.
 *
 * @param imageBuffer - Buffer da imagem (formato binário)
 * @returns Array de predições ordenadas por probabilidade (maior primeiro)
 *          ou null se falha na requisição ou credenciais inválidas
 *
 * Casos de falha:
 * - Credenciais não configuradas (AZURE_URL ou AZURE_KEY vazias/inválidas)
 * - Erro de rede (timeout, conexão)
 * - Resposta inválida da API
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const predicoes = await classificarImagem(Buffer.from(buffer));
 * const melhor = predicoes?.[0]; // maior probabilidade
 */
export async function classificarImagem(
  imageBuffer: Buffer,
): Promise<AzurePrediction[] | null> {
  // Validação básica: se credenciais não existem, retorna null
  // O código chamador deve tratar este caso como falha
  if (!AZURE_URL || !AZURE_KEY || AZURE_KEY.length < 10) return null;

  try {
    const res = await fetch(AZURE_URL, {
      method: "POST",
      headers: {
        "Prediction-Key": AZURE_KEY,
        "Content-Type": "application/octet-stream", // imagem bruta
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return (data.predictions as AzurePrediction[]) ?? null;
  } catch {
    // Qualquer erro (rede, timeout, parse) retorna null
    // O erro é silencioso para não expor detalhes internos
    return null;
  }
}
