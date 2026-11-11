# Spec de mudança: 006-vinculo-produto-certificado

- **Trilha:** correção (REQ-PROD-05 já existia na spec com critério de aceite definido; o servidor nunca implementou)
- **Capacidades afetadas:** PROD (`docs/capabilities/gestao-de-produtos`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (feature escolhida do backlog em 2026-11-11) · **Data:** 2026-11-11

## Problema

`PUT /api/produtos/[id]` não aceita nenhum campo relacionado a certificados. O vínculo `ProdutoCertificado` só é preenchido pelo seed (`prisma/seed.ts`); não há forma de um ADMIN associar ou remover certificados de um produto já existente pela API ou pelo painel.

## Fora de escopo

- Criar/editar certificados em si (já existe, `app/api/certificados`).
- Vincular certificado na criação do produto (`POST /api/produtos`) — REQ-PROD-05 fala em "edita um produto", e o produto precisa existir para ter o vínculo; a criação continua sem esse campo.
- Qualquer regra de "certificado obrigatório por categoria" ou similar — não pedida.

## Comportamento atual (fato, com evidência)

- `lib/schemas/produto.ts` (`atualizarProdutoSchema`): sem `certificadoIds`.
- `services/produto.service.ts::atualizarProduto`: só repassa os campos escalares do produto ao Prisma.
- `prisma/seed.ts`: é o único lugar que cria linhas em `ProdutoCertificado`.
- `docs/capabilities/gestao-de-produtos/status.md`: REQ-PROD-05 (implícito, sem linha própria — ver nota).

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-PROD-05 | Quando um ADMIN edita um produto, o sistema deve permitir associar e remover certificados. | `PUT /api/produtos/{id}` com `certificadoIds: number[]` substitui o vínculo inteiro; `certificadoIds: []` remove todos; `certificadoId` inexistente responde 404/409, nunca 500 | Já existia (❌→✅) |

## Cenários e casos-limite

- `certificadoIds` ausente no corpo: vínculo atual não é tocado (comportamento de "campo opcional", igual aos demais campos do PUT).
- `certificadoIds` com ids duplicados: deduplicado antes de gravar (evita erro de chave única sem motivo).
- `certificadoIds` com algum id inexistente: a violação de FK (`P2003`) responde 409 (mesmo padrão já usado para `categoriaId`/`marcaId` inexistentes, REQ-PROD-04).
- Produto inexistente: 404, igual ao comportamento atual do PUT (REQ-PROD-03).

## Regras de negócio e restrições

- Nenhuma regra nova; a substituição é atômica (`prisma.$transaction`): remove o vínculo antigo e grava o novo (ou nenhum) numa única transação, para não deixar o produto momentaneamente sem nenhum certificado se a segunda etapa falhar.

## Interfaces afetadas

`PUT /api/produtos/[id]` (campo `certificadoIds` no corpo) · painel ADMIN (aba Produtos → modal de edição ganha uma lista de certificados com checkbox).

## Delta na spec viva

`gestao-de-produtos/status.md`: REQ-PROD-05 ❌→✅ (teste). `gestao-de-produtos/spec.md`: resolve a pergunta aberta #2. `pendentes.md`: remove a linha do vínculo produto↔certificado do backlog.

## Perguntas em aberto

Nenhuma bloqueante. A pergunta aberta #1 da spec viva ("quem mantém produtos: só ADMIN ou também MARCA") continua sem resposta, sem relação com esta mudança.
