# Tarefas: 005-filtro-marca-ordenacao-preco

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | Testes falhando: REQ-CAT-06 (sort cross-page, precoMax) e REQ-CAT-07 (marcaId) em `tests/integration/catalogo.test.ts` | REQ-CAT-06, REQ-CAT-07 | — | testes existem e falham (400/sem efeito, pois os params não existem ainda) | [x] |
| T2 | `lib/schemas/produto.ts`: `marcaId`, `precoMax`, `sort` em `listarProdutosQuerySchema` | REQ-CAT-06, REQ-CAT-07 | T1 | schema aceita os 3 params | [x] |
| T3 | `services/produto.service.ts::listarProdutos`: `where`/`orderBy` dinâmicos (`ORDEM_POR_SORT`) | REQ-CAT-06, REQ-CAT-07 | T2 | T1 passa | [x] |
| T4 | `lib/hooks/useProdutos.ts::useListarProdutos`: 5º parâmetro `filtros` opcional | REQ-CAT-06, REQ-CAT-07 | T3 | compila sem quebrar as 2 chamadas existentes | [x] |
| T5 | `app/(store)/produtos/page.tsx`: remove ordenação/filtro client-side; filtro de marca (desktop+mobile, só `APROVADA`); contadores usam `total`; reset de página ao mudar sort/preço | REQ-CAT-06, REQ-CAT-07 | T4 | código compila (`tsc`), lint sem erro novo | [x] |
| T6 | Consolidar `catalogo/{spec,status}.md`; remover linha do backlog de `pendentes.md` | — | T1–T5 | `npm run sdd:check` passa | [x] |

## Nota

REQ-CAT-06/07 ficaram ✅ (não ◐): diferente das mudanças anteriores de UI pura, aqui a lógica decisiva (ordenação, filtro, contagem) está inteira na API e coberta por teste de integração real contra Postgres — não depende de verificação visual no navegador para estar correta. A única parte não verificada visualmente é a aparência da nova lista de marcas na sidebar, que é só apresentação sobre dados já corretos.
