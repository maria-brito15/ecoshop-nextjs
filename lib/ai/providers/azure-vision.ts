// lib/ai/providers/azure-vision.ts

/**
 * AZURE CUSTOM VISION - IMAGE CLASSIFICATION
 *
 * Integration with Azure Custom Vision to classify recyclable materials.
 *
 * Azure Custom Vision is an AI service that lets you train custom models for
 * image classification. In this project it identifies materials such as:
 * plastic, glass, paper, metal, organic, etc.
 *
 * Flow:
 * 1. Receives the image buffer sent by the user
 * 2. Sends it to the Azure prediction endpoint
 * 3. Returns an array of tags with probabilities
 *
 * IMPORTANT: The model must be trained beforehand in the Azure portal.
 * The recognized tags must include "outros" as a fallback.
 *
 * Required environment variables:
 * - AZURE_VISION_ENDPOINT: prediction endpoint URL
 * - AZURE_VISION_KEY: API access key
 */

import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

const AZURE_URL = process.env.AZURE_VISION_ENDPOINT ?? "";
const AZURE_KEY = process.env.AZURE_VISION_KEY ?? "";

/** Default time limit (initial value, not measured: adjust with real data; REQ-SCAN-09). */
const TIMEOUT_AZURE_MS = 10_000;

/**
 * Prediction returned by Azure Custom Vision.
 */
export interface AzurePrediction {
  /** Name of the identified tag/material (e.g. "plastico", "vidro", "papel") */
  tagName: string;
  /** Probability/confidence of the prediction (0 to 1) */
  probability: number;
}

/**
 * Classifies an image using Azure Custom Vision.
 *
 * @param imageBuffer - Image buffer (binary format)
 * @returns Array of predictions sorted by probability (highest first),
 *          or null on request failure or invalid credentials
 *
 * Failure cases:
 * - Credentials not configured (AZURE_URL or AZURE_KEY empty/invalid)
 * - Network error (timeout, connection)
 * - Invalid API response
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const predictions = await classifyImage(Buffer.from(buffer));
 * const best = predictions?.[0]; // highest probability
 */
export async function classifyImage(
  imageBuffer: Buffer,
  timeoutMs: number = TIMEOUT_AZURE_MS,
): Promise<AzurePrediction[] | null> {
  // Basic validation: if credentials are missing, return null
  // The caller must treat this case as a failure
  if (!AZURE_URL || !AZURE_KEY || AZURE_KEY.length < 10) return null;

  try {
    const res = await fetchWithTimeout(
      AZURE_URL,
      {
        method: "POST",
        headers: {
          "Prediction-Key": AZURE_KEY,
          "Content-Type": "application/octet-stream", // image bruta
        },
        body: new Uint8Array(imageBuffer),
      },
      timeoutMs,
    );

    if (!res.ok) return null;

    const data = await res.json();
    return (data.predictions as AzurePrediction[]) ?? null;
  } catch {
    // Any error (network, timeout, parse) returns null
    // The error is silent so internal details are not exposed
    return null;
  }
}
