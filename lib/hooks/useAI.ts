// lib/hooks/useAI.ts

/**
 * AI HOOKS
 *
 * Hooks for interacting with EcoShop's Artificial Intelligence features.
 *
 * Features:
 * - Chat: conversation with the sustainability assistant (Gemini)
 * - Scan: image analysis to identify recyclable materials (Azure Vision + Gemini)
 *
 * Why separate hooks?
 * - Each feature has different payload/response requirements
 * - Chat uses JSON, Scan uses FormData (file upload)
 *
 * Endpoints:
 * - Chat: POST /api/ai/chat (requires authentication)
 * - Scan: POST /api/ai/scan (requires authentication)
 */

import { useMutation } from "./useMutation";
import type { ChatBody, ChatResponse, ScanResponse } from "@/types/api";

/**
 * Hook for the chat with the sustainability assistant.
 * Requires authentication.
 *
 * The chat keeps the conversation history for context.
 *
 * @returns Mutation hook for sending messages to the chat
 *
 * @example
 * const chat = useChat();
 *
 * const sendMessage = async (msg, history) => {
 *   const result = await chat.execute("/api/ai/chat", {
 *     message: msg,
 *     history
 *   });
 *   if (result) setReply(result.answer);
 * };
 */
export function useChat() {
  return useMutation<ChatResponse, ChatBody>({ method: "POST" });
}

/**
 * Hook for image analysis (EcoScan AI).
 * Requires authentication — the user must be signed in.
 *
 * The request body must be a FormData containing:
 * - image: File (the image to analyze)
 *
 * @returns Mutation hook for sending images for analysis
 *
 * @example
 * const scan = useScan();
 * const formData = new FormData();
 * formData.append("image", imageFile);
 * const result = await scan.execute("/api/ai/scan", formData);
 *
 * if (result?.success) {
 *   console.log(`Identified material: ${result.material}`);
 *   console.log(`Confidence: ${result.confidence}%`);
 *   console.log(`Analysis: ${result.sustainability_analysis}`);
 * }
 */
export function useScan() {
  return useMutation<ScanResponse, FormData>({ method: "POST" });
}
