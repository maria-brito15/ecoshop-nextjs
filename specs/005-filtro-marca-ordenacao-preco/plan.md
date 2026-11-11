# Plano: 005-filtro-marca-ordenacao-preco

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0018 (status de marca — só marcas APROVADA aparecem no filtro) · **ADRs novos/que substitui:** nenhum

## Abordagem técnica

Tudo resolvido no banco (Prisma), não em memória:
1. `lib/schemas/produto.ts`: `listarProdutosQuerySchema` ganha `marcaId` (coerce number), `precoMax` (coerce number positivo) e `sort` (enum `relevancia|preco_asc|preco_desc|nome_asc|nome_desc`, default `relevancia`).
2. `services/produto.service.ts::listarProdutos`: `where` ganha `marcaId`/`preco: { lte: precoMax }` quando presentes; `orderBy` vira um mapa fixo (`ORDEM_POR_SORT`) indexado por `sort`, em vez do `{ id: "asc" }` fixo. `skip`/`take` continuam no Prisma, então a ordenação/filtro valem para a contagem (`total`) e para qualquer página.
3. `app/api/produtos/route.ts`: só documentação (a validação e a passagem de `searchParams` já eram genéricas).
4. `lib/hooks/useProdutos.ts::useListarProdutos`: 5º parâmetro opcional `filtros: { marcaId?, precoMax?, sort? }`, para não quebrar as duas chamadas existentes que só usam `(page, size)`.
5. `app/(store)/produtos/page.tsx`: remove `produtosSorted`/`produtosFiltrados` (ordenação/filtro client-side); passa `marcaId`/`precoMax`/`sort` para o hook; os contadores de "N produtos encontrados" passam a usar `total` (do servidor) em vez do tamanho do array da página; novo bloco de filtro por marca (desktop e mobile), só com marcas `status === "APROVADA"` (ADR-0018); muda `sort`/preço reseta a página para 1 (evita página vazia depois de um filtro reduzir o total).

Alternativa descartada: continuar ordenando/filtrando no cliente, mas sobre `size=100` (pedir tudo de uma vez). Rejeitada: multiplica o payload por página mesmo sem precisar, e ainda exigiria paginação manual no cliente — mais código para o mesmo resultado que o Prisma já faz de graça.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | sim | REQ-CAT-06 (2 testes: sort cross-page, precoMax) e REQ-CAT-07 (1 teste) |
| V Camadas | sim | sim | handler chama `services/`; filtro/ordenação ficam no service |
| XI Sem dado inventado | sim | sim | filtro de marca só lista marcas reais e aprovadas |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `lib/schemas/produto.ts` | `marcaId`, `precoMax`, `sort` em `listarProdutosQuerySchema` | REQ-CAT-06, REQ-CAT-07 |
| `services/produto.service.ts` | `where`/`orderBy` dinâmicos | REQ-CAT-06, REQ-CAT-07 |
| `app/api/produtos/route.ts` | doc dos novos query params | REQ-CAT-06, REQ-CAT-07 |
| `lib/hooks/useProdutos.ts` | `useListarProdutos` ganha `filtros` opcional | REQ-CAT-06, REQ-CAT-07 |
| `app/(store)/produtos/page.tsx` | remove ordenação/filtro client-side; filtro de marca na UI; contadores usam `total` | REQ-CAT-06, REQ-CAT-07 |
| `tests/integration/catalogo.test.ts` | 3 testes novos | REQ-CAT-06, REQ-CAT-07 |
| `docs/capabilities/catalogo/{spec,status}.md` | REQ-CAT-06/07 ❌→✅ | REQ-CAT-06, REQ-CAT-07 |
| `docs/architecture/adr/pendentes.md` | remove a linha do backlog | — |

## Plano de verificação

Integração (`tests/integration/catalogo.test.ts`): REQ-CAT-06 com `sort=preco_desc` em duas páginas (`size=5`, páginas 1 e 2) confirmando ordem decrescente contínua pelos 14 produtos; REQ-CAT-06 com `precoMax=15` confirmando `total=6` mesmo com `size=3`; REQ-CAT-07 com uma segunda marca e um produto exclusivo dela. REQ-CAT-01 a 05 e REQ-PROD-01/02 continuam passando sem alteração (não regressão). Manual: não feito (sem navegador nesta sessão) — mas a lógica de UI é testável via leitura do código, já que toda a decisão de filtro/ordenação migrou para a API, já coberta por teste.

## Riscos e reversão

Risco: `precoMax`/`sort`/`marcaId` combinados com cache (`chaveProdutos`) gerarem chaves inconsistentes. Mitigado: `chaveProdutos` já serializa `searchParams.toString()` genericamente, incluindo qualquer parâmetro novo automaticamente — sem mudança necessária em `lib/cache/keys.ts`. Reversão: reverter `services/produto.service.ts` e `lib/schemas/produto.ts` ao `where`/`orderBy` fixos; a UI e o hook toleram a ausência desses parâmetros (são todos opcionais).

## Complexity Tracking

Sem violações.
