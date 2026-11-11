# CAT · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-CAT-01 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-02 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-03 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-04 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-10 |
| REQ-CAT-05 | ✅ | test: tests/integration/catalog.test.ts (corrigido D9: lib/schemas/product.ts tem listarProdutosQuerySchema, validado em app/api/produtos/route.ts) | 2026-11-10 |
| REQ-CAT-06 | ✅ | test: tests/integration/catalog.test.ts (sort e precoMax aplicados no banco, confirmados entre páginas) | 2026-11-11 |
| REQ-CAT-07 | ✅ | test: tests/integration/catalog.test.ts | 2026-11-11 |
| REQ-CAT-08 | ◐ | código: services/product.service.ts (buscarProduto inclui certificados); sem teste | 2026-11-10 |
| REQ-CAT-09 | ✅ | test: tests/integration/input-and-errors.test.ts | 2026-11-11 |
| REQ-CAT-10 | ✅ | test: tests/integration/redis-and-cache.test.ts (chave estável, filtros distintos, nome normalizado, 400 acima de 100). O caminho do banco da listagem **não foi reexecutado** (catalog.test.ts precisa de banco) | 2026-11-11 |
