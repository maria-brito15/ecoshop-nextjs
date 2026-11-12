# Change spec: 004-chat-flutuante

- **Track:** fix (the code violates REQ-CHAT-06; the rule already exists in the spec, only the UI was missing)
- **Affected capabilities:** CHAT (`docs/capabilities/chat-sustentabilidade`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (G1: chose "floating button" between the two options on 2026-11-10, resolving open question #1 of the spec) · **Date:** 2026-11-10

## Problem

`POST /api/ia/chat` already works end to end (REQ-CHAT-01 to 05, 07, all ✅: authentication, rate limit, validation, Gemini error fallback). There is just no screen that uses it — REQ-CHAT-06 is ❌. The spec left open whether the interface would be a page of its own or a floating button; the owner decided on a floating button, visible on any page.

## Out of scope

- Any change to the chat backend (`app/api/ia/chat/route.ts`, `lib/schemas/ai-chat.ts`): it already works and is out of scope.
- Persisting the conversation on the server (already an explicit "out of scope" in the living spec).
- Deciding the scope of EcoScan/Azure (P06 also mentions this, but it is a separate capability — `ecoscan`, already implemented).

## Current behavior (fact, with evidence)

- `app/api/ia/chat/route.ts`: complete endpoint, tested (`tests/integration/chat-ai.test.ts`), accepts `{ mensagem, historico? }` and returns `{ resposta }`.
- `lib/hooks/useAI.ts:45-47` (`useChat`): a mutation hook already ready for this endpoint.
- No UI component called `useChat` before this change.
- `docs/capabilities/chat-sustentabilidade/status.md`: REQ-CHAT-06 ❌.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-CHAT-06 | When an authenticated user opens the chat, the system shall offer an interface to converse. | A floating button visible on any page for whoever has a session; it opens a panel with the conversation history and a message field | Already exists (❌→◐, see the verification note) |

## Scenarios and edge cases

- Visitor without a session: the floating button does not appear (the page calls `GET /api/auth/me`; without a session, `res.ok` is false).
- User exceeds 20 messages/min (REQ-CHAT-02): the screen shows the error returned by the API (`429`) in the panel's error area.
- Gemini unavailable (REQ-CHAT-03/04): the screen shows the returned error (`503`/`502`), without freezing the input.
- Reloading the page: the conversation history is lost (consistent with "context not persisted on the server").

## Business rules and constraints

- None new; it reuses BR-CHAT-01 (rate limit) and BR-CHAT-02 (message size), both already enforced by the backend.
- `ui.md`: the screen shows the `erro` message returned by the API, not a generic text.
- Constitution Art. XI: no invented data — the answer shown is always the one returned by Gemini through the API.

## Affected interfaces

`app/components/FloatingChat.tsx` (new) · `app/layout.tsx` (mounts the component for all pages).

## Delta in the living spec

`chat-sustentabilidade/status.md`: REQ-CHAT-06 ❌→◐ (code implemented; visual check in the browser missing). `chat-sustentabilidade/spec.md`: resolves open question #1 (floating button).

## Open questions

None blocking.
