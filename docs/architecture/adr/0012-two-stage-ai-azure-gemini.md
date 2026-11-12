# ADR-0012: AI in two stages: Azure Custom Vision classifies and Gemini explains, with a static fallback

- Status: Inferred
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: SCAN, CHAT

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `lib/ai/analyze-image.ts`; `providers/azure-vision.ts`, `providers/gemini-chat.ts`; threshold `AI_CONFIDENCE_THRESHOLD` (0.7) and tag `outros`; fallback `fallbackAnalysis`. The Azure model and its tags are artifacts external to the repository (few tags today, according to the owner).

## Problem
How do we identify the material in a photo and explain its disposal?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Classifier + LLM (current) | Controlled classes; lower cost per photo | Two vendors; the model needs training | — |
| B. A single multimodal LLM | Simplicity | Less control over the classes | — |
| C. Classifier + curated content | No LLM cost | Content to maintain | — |

## Decision
Keep A as historical; the scope of the AI is pending (P06).

## Rationale
Inferred.

## Consequences
Gemini's network without try/catch takes the scan down (D4). Affects: `lib/ai/**`, `api/ia/**`.

## Verification
Tests with simulated providers (Art. VIII).
