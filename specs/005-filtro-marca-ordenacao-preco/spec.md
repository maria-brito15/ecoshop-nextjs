# Spec de mudança: 005-filtro-marca-ordenacao-preco

- **Trilha:** correção (REQ-CAT-06/07 já existiam na spec; o servidor nunca implementou de fato — não é mudança de regra)
- **Capacidades afetadas:** CAT (`docs/capabilities/catalogo`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (feature escolhida do backlog em 2026-11-11) · **Data:** 2026-11-11

## Problema

`GET /api/produtos` não aceita `marcaId`, `precoMax` nem `sort`. A tela `/produtos` simulava os três no cliente: ordenava e filtrava por preço só os produtos da página já paginada pelo servidor (`produtosSorted`/`produtosFiltrados` sobre `data.produtos`), e não tinha filtro por marca algum. Isso viola diretamente REQ-CAT-06 ("aplicar ao catálogo inteiro, não apenas à página exibida") e deixa REQ-CAT-07 inexistente.

## Fora de escopo

- Qualquer outro filtro novo (ex.: por certificado).
- Mudar o tamanho de página (continua 12).
- Persistir a preferência de ordenação entre sessões.

## Comportamento atual (fato, com evidência)

- `lib/schemas/produto.ts` (`listarProdutosQuerySchema`): sem `marcaId`, `precoMax`, `sort`.
- `services/produto.service.ts::listarProdutos`: `orderBy: { id: "asc" }` fixo; `where` só filtra `categoriaId`/`nome`.
- `app/(store)/produtos/page.tsx:270-283` (antes da mudança): ordenava e filtrava por preço com `Array.prototype.sort`/`.filter` sobre os 12 itens já devolvidos pela página atual — e o contador "N produtos encontrados" mostrava esse N local, não o total real.
- `docs/capabilities/catalogo/status.md`: REQ-CAT-06/07 ❌.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-CAT-06 | Quando o visitante ordena por preço ou nome, ou limita o preço máximo, o sistema deve aplicar a ordenação e o limite ao catálogo inteiro, não apenas à página exibida. | `GET /api/produtos?sort=preco_desc&size=5` → os 5 itens são os 5 mais caros de todo o conjunto filtrado; a página 2 continua a mesma ordenação global. `precoMax` muda o `total`, não só o que é exibido | Já existia (❌→✅) |
| REQ-CAT-07 | Quando o visitante filtra por marca, o sistema deve devolver somente produtos dela. | `GET /api/produtos?marcaId=N` → só produtos da marca N | Já existia (❌→✅) |

## Cenários e casos-limite

- `sort` ausente ou `relevancia`: mantém o comportamento atual (`orderBy: id asc`).
- `sort` inválido (fora do enum): 400 (mesma validação Zod que já cobre `page`/`size`).
- `precoMax` combinado com `categoriaId`/`marcaId`/`nome`: todos os filtros se combinam em `AND` (mesmo padrão já usado por `categoriaId`/`nome`).
- Painel ADMIN (`size=100`, sem os novos filtros): continua funcionando sem alteração, pois todos os novos parâmetros são opcionais.
- Filtro de marca na tela: só lista marcas com `status === "APROVADA"` (ADR-0018) — uma marca pendente não aparece como opção de filtro no catálogo público.

## Regras de negócio e restrições

- Nenhuma regra nova; BR-CAT-01 (preço decimal positivo) não muda.
- O filtro e a ordenação são resolvidos pelo Prisma (`where`/`orderBy`), não em memória — é isso que garante "catálogo inteiro" em vez de "página atual".

## Interfaces afetadas

`GET /api/produtos` (query `marcaId`, `precoMax`, `sort`) · `lib/hooks/useProdutos.ts` (`useListarProdutos` ganha um 5º parâmetro opcional) · `app/(store)/produtos/page.tsx` (filtro por marca na UI; remove a ordenação/filtro client-side).

## Delta na spec viva

`catalogo/status.md`: REQ-CAT-06 ❌→✅, REQ-CAT-07 ❌→✅ (ambos com teste). `catalogo/spec.md`: resolve as duas perguntas abertas. `pendentes.md`: remove a linha do filtro por marca/ordenação do backlog.

## Perguntas em aberto

Nenhuma bloqueante.
