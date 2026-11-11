# CHAT · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-CHAT-01 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-02 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-03 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-04 | ✅ | test: tests/integration/chat-ai.test.ts (2026-11-10). Em 2026-11-11 a chamada ao Gemini foi movida para o provedor (REQ-CHAT-08/09); esse arquivo **não foi reexecutado** (precisa de banco) | 2026-11-10 |
| REQ-CHAT-05 | ✅ | test: tests/integration/chat-ai.test.ts | 2026-11-10 |
| REQ-CHAT-06 | ◐ | código: app/components/FloatingChat.tsx (botão flutuante, só para quem tem sessão); API confirmada via curl (401 sem sessão, chega ao Gemini com sessão). Falta verificação visual no navegador | 2026-11-10 |
| REQ-CHAT-07 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-CHAT-08 | ✅ | test: tests/integration/input-and-errors.test.ts (schema, chamada ao Gemini do chat e do scan, handler com 21 itens) | 2026-11-11 |
| REQ-CHAT-09 | ✅ | test: tests/integration/input-and-errors.test.ts | 2026-11-11 |
