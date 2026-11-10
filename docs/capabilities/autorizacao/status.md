# AUTZ · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-AUTZ-01 | ✅ | test: tests/integration/autorizacao.test.ts | 2026-11-10 |
| REQ-AUTZ-02 | ✅ | test: tests/integration/autorizacao.test.ts | 2026-11-10 |
| REQ-AUTZ-03 | ✅ | test: tests/integration/autorizacao.test.ts | 2026-11-10 |
| REQ-AUTZ-04 | ✅ | test: tests/integration/autorizacao.test.ts | 2026-11-10 |
| REQ-AUTZ-05 | ✅ | test: tests/integration/autorizacao.test.ts | 2026-11-10 |
| REQ-AUTZ-06 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-AUTZ-07 | ❌ | código: não há declaração de política por rota; o acesso é decidido por chamadas pontuais a requireAdmin/requireAuth (app/_middleware/auth.ts) | 2026-11-10 |
| REQ-AUTZ-08 | ❔ | código: a página é pública e só a chamada à API devolve 401 (ver pergunta aberta 1) | 2026-11-10 |
