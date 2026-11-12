// app/api/ia/scan/route.ts

/**
 * AI SCAN API ROUTE - ECOSCAN
 *
 * API route for AI image analysis (recognition of recyclable items).
 *
 * POST /api/ia/scan - Analyzes an image and returns recycling information
 *
 * Private endpoint - requires authentication (signed-in user).
 *
 * Flow:
 * 1. Checks the user's authentication (requireAuth)
 * 2. Extracts the file from the FormData
 * 3. Validates the file type and size
 * 4. Converts it to a Buffer for processing
 * 5. Calls the AI service to analyze the image
 * 6. Returns the result (success with data or error)
 *
 * Limits:
 * - Maximum size: 10MB
 * - Accepted formats: JPG, PNG, GIF, WebP
 *
 * @see lib/ai/analyze-image.ts - Analysis orchestration
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { analisarImagem } from "@/lib/ai";
import { ERRORS } from "@/lib/http/responses";
import { requireAuth } from "@/app/_middleware/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/ia/scan - Analyzes an image
 *
 * Requires authentication (signed-in user).
 *
 * @body FormData with an 'image' field (file)
 * @returns ScanResult (success or failure)
 * @status 200 - Analysis successful
 * @status 401 - Not authenticated
 * @status 400 - Invalid data (missing file, wrong type, size exceeded)
 * @status 422 - The image could not be analyzed (format not supported by the AI)
 * @status 500 - Internal error
 */
export async function POST(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return ERRORS.invalidData("Nenhuma imagem enviada");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return ERRORS.invalidData(
        "Invalid format. Use: jpg, jpeg, png, gif or webp",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return ERRORS.invalidData("File too large (max: 10MB)");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageId = `analise_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const result = await analisarImagem(buffer, imageId);

    return NextResponse.json(result, {
      status: result.sucesso ? 200 : 422,
    });
  } catch (err) {
    return ERRORS.internal("process analysis", err);
  }
}
