// lib/hooks/useIA.ts

/**
 * ============================================================================
 * IA HOOKS
 * ============================================================================
 * Hooks para interação com as funcionalidades de Inteligência Artificial do EcoShop.
 *
 * Funcionalidades:
 * - Chat: conversa com o assistente de sustentabilidade (Gemini)
 * - Scan: análise de imagem para identificar materiais recicláveis (Azure Vision + Gemini)
 *
 * Por que hooks separados?
 * - Cada funcionalidade tem requisitos diferentes de payload/resposta
 * - Chat usa JSON, Scan usa FormData (upload de arquivo)
 *
 * Endpoints:
 * - Chat: POST /api/ia/chat (público)
 * - Scan: POST /api/ia/scan (requer autenticação)
 * ============================================================================
 */

import { useMutation } from "./useMutation";
import type { ChatBody, ChatResponse, ScanResponse } from "@/types/api";

/**
 * Hook para chat com assistente de sustentabilidade.
 * Endpoint público — qualquer usuário pode usar.
 *
 * O chat mantém histórico da conversa para contexto.
 *
 * @returns Mutation hook para envio de mensagens ao chat
 *
 * @example
 * const chat = useChat();
 *
 * const enviarMensagem = async (msg, historico) => {
 *   const result = await chat.executar("/api/ia/chat", {
 *     mensagem: msg,
 *     historico
 *   });
 *   if (result) setResposta(result.resposta);
 * };
 */
export function useChat() {
  return useMutation<ChatResponse, ChatBody>({ method: "POST" });
}

/**
 * Hook para análise de imagem (EcoScan IA).
 * Requer autenticação — usuário precisa estar logado.
 *
 * O corpo da requisição deve ser um FormData contendo:
 * - image: File (a imagem a ser analisada)
 *
 * @returns Mutation hook para envio de imagens para análise
 *
 * @example
 * const scan = useScan();
 * const formData = new FormData();
 * formData.append("image", imagemFile);
 * const result = await scan.executar("/api/ia/scan", formData);
 *
 * if (result?.sucesso) {
 *   console.log(`Material identificado: ${result.material}`);
 *   console.log(`Confiança: ${result.confianca}%`);
 *   console.log(`Análise: ${result.analise_sustentabilidade}`);
 * }
 */
export function useScan() {
  return useMutation<ScanResponse, FormData>({ method: "POST" });
}
