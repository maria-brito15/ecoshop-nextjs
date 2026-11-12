# Tasks: 004-floating-chat

| ID | Task | REQ | Depends on | Done when | OK |
|---|---|---|---|---|---|
| T1 | `app/components/FloatingChat.tsx`: session check, local history, `useChat`, error display | REQ-CHAT-06 | — | the code compiles (`tsc`), lint with no new error | [x] |
| T2 | Mount `<FloatingChat />` in `app/layout.tsx` | REQ-CHAT-06 | T1 | appears on every page | [x] |
| T3 | Verify `POST /api/ia/chat` against the real dev server, authenticated and without a session | REQ-CHAT-06 | T1 | `curl` confirms 401 without a session and that, authenticated, the request gets past auth/rate-limit/validation up to the call to Gemini | [x] |
| T4 | Consolidate `sustainability-chat/{spec,status}.md`; remove the chat row from `pending.md` | — | T1, T2 | `npm run sdd:check` passes | [x] |

## Note

REQ-CHAT-06 stays ◐, not ✅: `curl` confirmed that without a session the API responds 401 (the widget is also hidden in that case) and that, authenticated, the request reaches the call to Gemini — but that call returned 502 in this environment (without changing `app/api/ia/chat/route.ts`, which was not touched in this change; it seems to be a lack of outbound internet access in the sandbox, not a code defect). Without a browser for the visual test or a confirmed real answer from Gemini, a `manual: YYYY-MM-DD` is missing to become ✅.
