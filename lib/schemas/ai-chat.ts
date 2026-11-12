// lib/schemas/ai-chat.ts

/**
 * AI CHAT SCHEMAS (Zod)
 *
 * Validation schema for the AI chat endpoint (Gemini).
 *
 * The chat lets users ask questions about sustainability,
 * recycling, proper disposal of materials, etc.
 *
 * Features:
 * - Supports multi-turn conversations via history
 * - Limits the message size (2000 characters) to prevent abuse
 * - Validates the history format for compatibility with the Gemini API
 *
 * Endpoint that uses this schema:
 * - POST /api/ia/chat
 */

import { z } from "zod";

/**
 * Schema for validating AI chat requests.
 *
 * Rules:
 * - mensagem: required, minimum 1 character, maximum 2000
 * - historico: optional, array of previous messages
 *
 * The history format follows the Gemini API standard:
 * - role: 'user' (user message) or 'model' (AI reply)
 * - parts: array of objects with a 'text' field
 *
 * Why validate the history?
 * - Avoid malformed data that would break the Gemini API
 * - Prevent injection of messages with invalid roles
 * - Limit the history size (implicitly via JSON size)
 *
 * @example
 * // Request without history (first message)
 * const body = {
 *   mensagem: "How do I recycle plastic?"
 * };
 *
 * @example
 * // Request with history (continuing the conversation)
 * const body = {
 *   mensagem: "And glass?",
 *   historico: [
 *     { role: "user", parts: [{ text: "How do I recycle plastic?" }] },
 *     { role: "model", parts: [{ text: "Plastic should be washed..." }] }
 *   ]
 * };
 */
export const chatSchema = z.object({
  mensagem: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long (maximum 2000 characters)"),
  // REQ-CHAT-08: history limits (chosen by spec 009: they mirror the
  // `mensagem` limit); without them a client could send hundreds of
  // huge turns and spend tokens at the project's expense.
  historico: z
    .array(
      z.object({
        role: z.enum(["user", "model"], {
          message: "role must be 'user' or 'model'",
        }),
        parts: z
          .array(
            z.object({
              text: z
                .string()
                .max(2000, "History text too long (maximum 2000 characters)"),
            }),
          )
          .max(5, "History item has too many parts (maximum 5)"),
      }),
    )
    .max(20, "History too long (maximum 20 items)")
    .optional()
    .default([]),
});

// Inferred type for use in the API route
export type ChatInput = z.infer<typeof chatSchema>;
