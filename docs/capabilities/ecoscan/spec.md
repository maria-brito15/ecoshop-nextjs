# SCAN · EcoScan (material identification from a photo)

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0012

## Goal

From a photo, identify the material (Azure Custom Vision) and explain its sustainability (Gemini), with a fallback when the explanation fails.

## Actors

Authenticated user (any role).

## Business rules

- **BR-SCAN-01** — Minimum confidence threshold 0.7 (configurable through AI_CONFIDENCE_THRESHOLD).
- **BR-SCAN-02** — The tag "outros" is never an identification.
- **BR-SCAN-03** — Confidence is returned as an integer percentage.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-SCAN-01 | When a valid image is sent and the material is identified with confidence equal to or above the threshold, the system shall return the material, the confidence and the sustainability analysis with 6 fields. | 200 response with sucesso, material, confianca and the 6 analysis fields |
| REQ-SCAN-02 | If the confidence is below the threshold, the system shall respond 422 without querying Gemini. | Azure with 0.4 → 422 and no call to Gemini |
| REQ-SCAN-03 | If the best tag is "outros", the system shall treat the image as unidentified, even with high confidence. | Azure returns outros 0.95 → 422 |
| REQ-SCAN-04 | If Gemini returns invalid content, the system shall respond 200 with the fallback analysis. | Gemini returns text without JSON → 200 with the default analysis |
| REQ-SCAN-05 | If the call to Gemini fails because of the network, the system shall respond 200 with the fallback analysis. | fetch throws → 200 with the default analysis |
| REQ-SCAN-06 | If the file is missing, is not an accepted image or exceeds 10 MB, the system shall respond 400. | No file, .gif or 11 MB → 400 |
| REQ-SCAN-07 | If Azure does not respond or fails, the system shall respond 422 with a suggestion to the user, not 500. | Azure fetch fails → 422 |
| REQ-SCAN-08 | When the analysis indicates correct disposal and impact, the system shall show them on the EcoScan screen. | The screen shows the 6 returned fields |
| REQ-SCAN-09 | The system shall apply a timeout to the calls to Azure and to Gemini and treat the overrun as a dependency failure (REQ-SCAN-05 and REQ-SCAN-07). | A call that does not respond is aborted; Azure → `null` (422 in the route), Gemini → `null` (fallback) |

## Edge cases

The tags recognized by the Azure model are still few and are not documented (owner's answer, 2026-11-10). No rate limit on the scan (see the open question).

## Interfaces

POST /api/ia/scan (multipart, field file) · Azure Custom Vision (prediction) · Gemini 2.0 Flash · page /ia-scan.

## Applicable NFRs

NFR-SEG-05, NFR-DES-02.

## Out of scope

Saving scan history; identifying more than one material per photo.

## Open questions

1. Which tags does the Azure model recognize today? (document in external-interfaces)
2. Does the scan need a per-user request limit, like the chat?
