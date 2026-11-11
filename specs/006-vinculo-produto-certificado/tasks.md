# Tarefas: 006-vinculo-produto-certificado

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | Testes falhando: REQ-PROD-05 (substituição completa, `[]` remove tudo, id inexistente não é 500) em `tests/integration/catalog.test.ts` | REQ-PROD-05 | — | testes existem e falham (campo ignorado pelo schema) | [x] |
| T2 | `lib/schemas/product.ts`: `certificadoIds` em `atualizarProdutoSchema` | REQ-PROD-05 | T1 | schema aceita o campo | [x] |
| T3 | `services/product.service.ts::atualizarProduto`: transação que substitui o vínculo | REQ-PROD-05 | T2 | T1 passa | [x] |
| T4 | `types/api.ts`: `AtualizarProdutoBody.certificadoIds` | REQ-PROD-05 | T3 | compila | [x] |
| T5 | Painel: checklist de certificados no modal de edição | REQ-PROD-05 | T4 | código compila (`tsc`), lint sem erro novo | [x] |
| T6 | Consolidar `gestao-de-produtos/{spec,status}.md`; remover linha do backlog de `pendentes.md` | — | T1–T5 | `npm run sdd:check` passa | [x] |

## Nota

REQ-PROD-05 fica ✅: a lógica decisiva (substituição do vínculo, remoção total, erro de FK) está na API e coberta por teste de integração real contra Postgres. A UI do painel (checklist de certificados) não foi verificada visualmente no navegador (indisponível nesta sessão), mas só espelha o que a API já garante corretamente.
