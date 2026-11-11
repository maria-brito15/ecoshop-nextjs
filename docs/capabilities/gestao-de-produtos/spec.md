# PROD · Gestão de produtos (painel administrativo)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-11. ADRs: ADR-0009 · ADR-0017

## Objetivo

Permitir que ADMIN crie, edite e exclua produtos do catálogo.

## Atores

ADMIN.

## Regras de negócio

- **BR-PROD-01** — Todo produto pertence a uma categoria e a uma marca existentes.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-PROD-01 | Quando um ADMIN cria um produto válido, o sistema deve responder 201 e deve listá-lo no catálogo logo em seguida. | POST /api/produtos → 201; a listagem com o nome do produto o inclui sem esperar o TTL |
| REQ-PROD-02 | Quando uma marca ou categoria é alterada, o sistema deve refletir o novo nome nos produtos exibidos sem esperar o vencimento do cache. | Renomear a marca → GET /api/produtos/[id] já mostra o novo nome |
| REQ-PROD-03 | Se um ADMIN atualiza um produto que não existe, o sistema deve responder 404. | PUT /api/produtos/99999999 → 404 |
| REQ-PROD-04 | Se um ADMIN cria ou atualiza um produto com categoria ou marca inexistente, o sistema deve responder 4xx com mensagem clara. | categoriaId inexistente → 404 ou 409, não 500 |
| REQ-PROD-05 | Quando um ADMIN edita um produto, o sistema deve permitir associar e remover certificados. | PUT com certificadoIds atualiza o vínculo |
| REQ-PROD-06 | Se o `id` de `PUT` ou `DELETE /api/produtos/[id]` não é um inteiro positivo, o sistema deve responder 400. | ADMIN com `id=abc` → 400 |
| REQ-PROD-07 | Se um ADMIN tenta excluir um produto que tem certificados vinculados, o sistema deve responder 409 e manter produto e vínculos; depois de desvincular os certificados (`PUT` com `certificadoIds: []`), a exclusão deve funcionar. Decisão do dono (2026-11-11): bloqueio, não cascata. | `DELETE` com certificado vinculado → 409; após `PUT {certificadoIds: []}` → 200 |

## Casos-limite

O painel lista até 100 produtos de uma vez (sem paginação). Preço enviado como número JSON. Exclusão de produto com certificados: a FK do vínculo é RESTRICT (verificar).

## Interfaces

POST /api/produtos · PUT/DELETE /api/produtos/[id] · página /painel (aba Produtos).

## NFRs aplicáveis

NFR-CONS-01.

## Fora de escopo

Importação em massa; histórico de alterações.

## Perguntas abertas

1. Quem mantém produtos: só ADMIN ou também MARCA (para os próprios)?
