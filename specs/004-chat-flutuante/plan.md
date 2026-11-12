# Plan: 004-chat-flutuante

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0012 (AI in two stages / Gemini model) · **New ADRs / ones it supersedes:** none

## Technical approach

A new component `app/components/FloatingChat.tsx` ("use client"), mounted in `app/layout.tsx` next to `<Header />` so that it shows on every page. It:
1. Checks the session with `GET /api/auth/me` (same pattern as the internal `useSession` of `Header.tsx`); without a session, it renders nothing (`return null`).
2. Keeps `messages` (local history, not persisted) and uses `useChat()` (`lib/hooks/useAI.ts`, already existing) to call `POST /api/ia/chat`, converting the local history to the `{ role, parts: [{ text }] }` format that the API expects.
3. Shows the error returned by the API (`chat.erro`) instead of a generic text (`ui.md`).

Discarded alternative: a shared session hook extracted from `Header.tsx`. Rejected for this change because it increases the scope (refactoring `Header.tsx` is not necessary just for the chat); the new component does its own light check, the same way `Header.tsx` already does.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | partial | backend already 100% tested (REQ-CHAT-01 to 05, 07); UI without a component suite in the project (ADR-0016 covers only the API) — a manual check in the browser is missing |
| III Authorization | yes | yes | the UI only calls the API, which already requires a session (`requireAuth`); the UI disappears without a session, but the real access decision stays in the handler |
| V Layers | yes | yes | the component only consumes `useChat`/`fetch`, no direct call to `lib/db` |
| VII Errors | yes | yes | shows `chat.erro` (the API's `erro` field) |
| XI No invented data | yes | yes | only shows text coming from the API |

## Affected files

| File | Change | REQ |
|---|---|---|
| `app/components/FloatingChat.tsx` (new) | floating button + chat panel | REQ-CHAT-06 |
| `app/layout.tsx` | mounts `<FloatingChat />` | REQ-CHAT-06 |
| `docs/capabilities/chat-sustentabilidade/{spec,status}.md` | REQ-CHAT-06 ❌→◐; resolves open question #1 | REQ-CHAT-06 |
| `docs/architecture/adr/pendentes.md` | removes the chat row from the backlog | — |

## Verification plan

API: REQ-CHAT-01 to 05, 07 already covered by `tests/integration/chat-ai.test.ts`, unchanged. Manual pending: open any page authenticated, see the floating button, send a message and receive an answer; logged out, confirm that the button does not appear — not done in this session for lack of a browser tool.

## Risks and rollback

Risk: the component appearing for visitors without a session and failing on send. Mitigated by checking `GET /api/auth/me` before rendering. Rollback: remove the `<FloatingChat />` line from `app/layout.tsx` (the component alters no other file).

## Complexity Tracking

No violations.
