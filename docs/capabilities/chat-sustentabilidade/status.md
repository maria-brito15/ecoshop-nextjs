# CHAT · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-CHAT-01 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-02 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-03 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-04 | ✅ | test: tests/integration/chat-ai.test.ts (2026-11-10). On 2026-11-11 the Gemini call was moved to the provider (REQ-CHAT-08/09); that file **was not re-run** (needs a database) | 2026-11-10 |
| REQ-CHAT-05 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-06 | ◐ | code: app/components/FloatingChat.tsx (floating button, only for those with a session); API confirmed via curl (401 without a session, reaches Gemini with a session). Visual check in the browser is missing | 2026-11-10 |
| REQ-CHAT-07 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-CHAT-08 | ✅ | test: tests/integration/input-and-errors.test.ts (schema, the chat's and the scan's Gemini call, handler with 21 items) | 2026-11-11 |
| REQ-CHAT-09 | ✅ | test: tests/integration/input-and-errors.test.ts | 2026-11-11 |
