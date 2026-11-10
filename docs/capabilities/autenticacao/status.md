# AUTH · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-AUTH-01 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-02 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-03 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-04 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-05 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-06 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-07 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-08 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-09 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-10 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-11 | ❌ | código: o cadastro público cria MARCA imediatamente (lib/schemas/usuario.ts, registroPublicoSchema; teste todo em autenticacao.test.ts) | 2026-11-10 |
| REQ-AUTH-12 | ◐ | código: lib/schemas/usuario.ts (min 8); sem teste automatizado | 2026-11-10 |
| REQ-AUTH-13 | ❔ | ADR pendente P02: hoje o token vale até 7 dias | 2026-11-10 |
