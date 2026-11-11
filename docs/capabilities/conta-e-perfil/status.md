# PERF · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-PERF-01 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-02 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-03 | ✅ | test: tests/integration/perfil-e-middleware.test.ts | 2026-11-10 |
| REQ-PERF-04 | ◐ | código: app/(perfil)/perfil/page.tsx lê data.erro (corrigido em specs/001, 2026-11-10); falta verificação manual na tela | 2026-11-10 |
| REQ-PERF-05 | ◐ | código: app/(store)/produtos/[id]/page.tsx grava `ecoshop_history` (dedup, mais recente primeiro, limite 50); app/(perfil)/perfil/page.tsx renderiza a lista. Lógica de gravação verificada por simulação em Node; falta verificação manual no navegador | 2026-11-11 |
| REQ-PERF-06 | ◐ | código: app/(perfil)/perfil/page.tsx (`ImpactCard` com `fonte`) — "Explorador Verde" é contagem real; as outras duas métricas declaram a fórmula como estimativa ilustrativa (mesmo padrão de REQ-CONT-02/05). Falta verificação manual na tela | 2026-11-11 |
