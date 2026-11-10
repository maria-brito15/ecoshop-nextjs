# CAT · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-CAT-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-02 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-03 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-04 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-CAT-05 | ✅ | test: tests/integration/catalogo.test.ts (corrigido D9: lib/schemas/produto.ts tem listarProdutosQuerySchema, validado em app/api/produtos/route.ts) | 2026-11-10 |
| REQ-CAT-06 | ❌ | decidido (2026-11-10): fica em backlog; é funcionalidade nova (ordenação/limite de preço no catálogo inteiro), hoje não existe nem no servidor. Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
| REQ-CAT-07 | ❌ | decidido (2026-11-10): fica em backlog; o README atual não promete mais isso, mas o filtro por marca continua não implementado. Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
| REQ-CAT-08 | ◐ | código: services/produto.service.ts (buscarProduto inclui certificados); sem teste | 2026-11-10 |
