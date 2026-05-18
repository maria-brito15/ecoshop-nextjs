// lib/schemas/ia-chat.ts

/**
 * ============================================================================
 * IA CHAT SCHEMAS (Zod)
 * ============================================================================
 * Schema de validação para o endpoint de chat com IA (Gemini).
 *
 * O chat permite que usuários façam perguntas sobre sustentabilidade,
 * reciclagem, descarte correto de materiais, etc.
 *
 * Características:
 * - Suporta conversas multi-turno via histórico
 * - Limita tamanho da mensagem (2000 caracteres) para evitar abuso
 * - Valida formato do histórico para compatibilidade com API Gemini
 *
 * Endpoint que usa este schema:
 * - POST /api/ia/chat
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema para validação de requisições ao chat IA.
 *
 * Regras:
 * - mensagem: obrigatória, mínimo 1 caractere, máximo 2000
 * - historico: opcional, array de mensagens anteriores
 *
 * Formato do histórico segue o padrão da API Gemini:
 * - role: 'user' (mensagem do usuário) ou 'model' (resposta da IA)
 * - parts: array de objetos com campo 'text'
 *
 * Por que validar o histórico?
 * - Evitar dados malformados que quebrariam a API do Gemini
 * - Prevenir injeção de mensagens com roles inválidas
 * - Limitar o tamanho do histórico (implicitamente pelo JSON size)
 *
 * @example
 * // Requisição sem histórico (primeira mensagem)
 * const body = {
 *   mensagem: "Como reciclar plástico?"
 * };
 *
 * @example
 * // Requisição com histórico (continuando conversa)
 * const body = {
 *   mensagem: "E o vidro?",
 *   historico: [
 *     { role: "user", parts: [{ text: "Como reciclar plástico?" }] },
 *     { role: "model", parts: [{ text: "O plástico deve ser lavado..." }] }
 *   ]
 * };
 */
export const chatSchema = z.object({
  mensagem: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(2000, "Mensagem muito longa (máximo 2000 caracteres)"),
  historico: z
    .array(
      z.object({
        role: z.enum(["user", "model"], {
          message: "role deve ser 'user' ou 'model'",
        }),
        parts: z.array(
          z.object({
            text: z.string(),
          }),
        ),
      }),
    )
    .optional()
    .default([]),
});

// Tipo inferido para uso na rota da API
export type ChatInput = z.infer<typeof chatSchema>;
