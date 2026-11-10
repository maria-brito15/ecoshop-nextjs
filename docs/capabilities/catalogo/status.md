# CAT · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-CAT-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-02 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-03 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-04 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-05 | ❌ | código: services/produto.service.ts:57-58 converte sem validar (D9); teste todo em catalogo.test.ts | 2026-11-10 |
| REQ-CAT-06 | ❔ | código: produtos/page.tsx ordena e filtra só os 12 itens carregados; confirmar o comportamento desejado | 2026-11-10 |
| REQ-CAT-07 | ❔ | o README promete; a API e a tela não têm filtro por marca; confirmar se é requisito | 2026-11-10 |
| REQ-CAT-08 | ◐ | código: services/produto.service.ts (buscarProduto inclui certificados); sem teste | 2026-11-10 |
