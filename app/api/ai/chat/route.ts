// app/api/ai/chat/route.ts

/**
 * AI CHAT API ROUTE - GEMINI
 *
 * API route for chatting with the AI (Gemini) about sustainability and recycling.
 *
 * POST /api/ai/chat - Sends a message and receives the AI reply
 *
 * Requires authentication and applies a per-user rate limit.
 * Uses Google's Gemini 2.0 Flash model.
 *
 * Flow:
 * 1. Validates the user input (message and history)
 * 2. Checks that the Gemini API key is configured
 * 3. Builds the full history with the system prompt
 * 4. Calls the Gemini API with temperature settings
 * 5. Returns the generated reply
 *
 * Generation parameters (generationConfig):
 * - temperature: 0.8 → controls creativity
 * - topK: 40 → number of candidate words considered
 * - topP: 0.95 → nucleus sampling
 * - maxOutputTokens: 1024 → maximum response length
 *
 * @see lib/ai/providers/gemini-chat.ts - Gemini client
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ERRORS } from "@/lib/http/responses";
import { chatSchema } from "@/lib/schemas/ai-chat";
import {
  generateWithHistory,
  isGeminiConfigured,
} from "@/lib/ai/providers/gemini-chat";
import { requireAuth } from "@/app/_middleware/auth";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are an expert assistant in sustainability and recycling for EcoShop. Answer in English. Be objective and informative. Give practical tips on proper disposal, recycling and sustainable alternatives.`;

/**
 * POST /api/ai/chat - Chat with the AI assistant
 *
 * @body { message: string, history?: ChatMessage[] }
 * @returns { answer: string }
 * @status 200 - Reply generated successfully
 * @status 400 - Invalid data
 * @status 401 - Not authenticated
 * @status 429 - Too many messages (rate limit)
 * @status 503 - AI not configured (missing key)
 * @status 502 - AI returned an error
 * @status 500 - Internal server error
 */
// Per-user limit: the chat consumes the paid Gemini quota (D3).
const MESSAGE_LIMIT = 20;
const WINDOW_SECONDS = 60;

export async function POST(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const session = await getSession(req);
  const { blocked } = await rateLimit(`chat:${session!.id}`, {
    limit: MESSAGE_LIMIT,
    windowSeconds: WINDOW_SECONDS,
  });
  if (blocked) {
    return NextResponse.json(
      { error: "Too many messages. Wait 1 minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) return ERRORS.invalidData(parsed.error.flatten());

    const { message, history } = parsed.data;

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I am ready to help with sustainability and recycling questions.",
          },
        ],
      },
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    // Never throws: failure, timeout or invalid response become `null` (502).
    const response = await generateWithHistory(contents, {
      temperature: 0.8,
      maxOutputTokens: 1024,
    });

    if (!response) {
      return NextResponse.json(
        { error: "Error generating the AI response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ answer: response });
  } catch (err) {
    return ERRORS.internal("processar chat", err);
  }
}
