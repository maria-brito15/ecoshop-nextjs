# CHAT · Sustainability chat

> Living spec. Source of truth for the expected behavior. Last review: 2026-11-10. ADRs: ADR-0012

## Goal

Answer authenticated users' questions about sustainability using Gemini, with a floating chat button visible on any page.

## Actors

Authenticated user (any role).

## Business rules

- **BR-CHAT-01** — Limit of 20 messages per minute per user.
- **BR-CHAT-02** — A message has 1 to 2000 characters.

## Requirements

| ID | Requirement (EARS) | Acceptance |
|---|---|---|
| REQ-CHAT-01 | When an authenticated user sends a valid message, the system shall return Gemini's answer. | POST /api/ia/chat → 200 with the answer |
| REQ-CHAT-02 | If the user exceeds 20 messages per minute, the system shall respond 429. | The 21st message in 60 s → 429 |
| REQ-CHAT-03 | If the Gemini key is not configured, the system shall respond 503. | Without GEMINI_API_KEY → 503 |
| REQ-CHAT-04 | If Gemini fails, the system shall respond 502. | Gemini returns an error → 502 |
| REQ-CHAT-05 | If the message is empty or has more than 2000 characters, the system shall respond 400. | "" and 2001 characters → 400 |
| REQ-CHAT-06 | When an authenticated user opens the chat, the system shall offer an interface to converse. | There is a screen with a message field and the conversation history |
| REQ-CHAT-07 | If a visitor without a session sends a message, the system shall respond 401. | POST without a cookie → 401 |
| REQ-CHAT-08 | If the chat `historico` has more than 20 items, or any text exceeds 2000 characters, or any item has more than 5 parts, the system shall respond 400; the Gemini key shall go in the `x-goog-api-key` header, never in the URL. | 21 items → 400; the Gemini call has no `key=` in the URL |
| REQ-CHAT-09 | If the call to Gemini throws or exceeds the time limit, the chat shall respond 502 (like REQ-CHAT-04), not 500. | A `fetch` that throws → 502 |

## Edge cases

The conversation context is not persisted on the server. Fixed on 2026-11-10: before, the chat was public and unlimited (D3).

## Interfaces

POST /api/ia/chat · Gemini 2.0 Flash · `app/components/FloatingChat.tsx` (mounted in `app/layout.tsx`).

## Applicable NFRs

NFR-SEG-05.

## Out of scope

Persisting conversations; real-time chat.

## Open questions

None. The question about where the chat appears was resolved on 2026-11-10 (floating button, `specs/004-chat-flutuante/spec.md`).
