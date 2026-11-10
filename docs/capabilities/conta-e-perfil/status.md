# PERF · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-PERF-01 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-02 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-03 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-04 | ◐ | código: app/(perfil)/perfil/page.tsx lê data.erro (corrigido em specs/001, 2026-11-10); falta verificação manual na tela | 2026-11-10 |
| REQ-PERF-05 | ❌ | decidido (2026-11-10): fica em backlog; código: a chave localStorage `ecoshop_history` só é lida (perfil/page.tsx:467), nunca gravada. Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
| REQ-PERF-06 | ❌ | decidido (2026-11-10): fica em backlog; depende de REQ-PERF-05 e de fonte real para as métricas (mesma decisão de REQ-CONT-02). Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
