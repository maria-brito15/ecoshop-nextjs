# AUTZ · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-AUTZ-01 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-02 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-03 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-04 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-05 | ✅ | test: tests/integration/authorization.test.ts | 2026-11-10 |
| REQ-AUTZ-06 | ✅ | test: tests/integration/profile-and-middleware.test.ts | 2026-11-10 |
| REQ-AUTZ-07 | ✅ | test: tests/integration/authorization.test.ts (guarda de regressão por análise estática de app/api/**/route.ts; ADR-0017 decidiu que a política mora no handler, não numa tabela central — este teste supre a falta dela) | 2026-11-10 |
| REQ-AUTZ-08 | ✅ | test: tests/integration/profile-and-middleware.test.ts (decisão 2026-11-10: exigir login; config/protected-routes.ts e middleware.ts protegem /ia-scan) | 2026-11-10 |
