# USR · Gestão de usuários (ADMIN)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0017 · ADR-0018

## Objetivo

Permitir que ADMIN liste, crie, edite e exclua usuários, e aprove pedidos de MARCA pendentes.

## Atores

ADMIN.

## Regras de negócio

- **BR-USR-01** — A senha é sempre guardada com hash e nunca devolvida.
- **BR-USR-02** — Excluir um usuário que tem marca é restringido pelo banco.
- **BR-USR-03** — A aprovação de uma marca pendente muda `Marca.status` e `Usuario.tipo` juntos, de forma atômica (ADR-0018).

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-USR-01 | Quando um ADMIN lista usuários, o sistema deve devolver dados públicos (id, nome, e-mail, telefone, tipo, criadoEm), sem o hash da senha. | GET /api/usuarios por ADMIN → 200, sem campo senha |
| REQ-USR-02 | Quando um ADMIN cria um usuário válido, o sistema deve guardar a senha com hash e responder 201 sem o hash. | POST /api/usuarios → 201 e banco com hash bcrypt |
| REQ-USR-03 | Quando um ADMIN aprova um pedido de MARCA, o sistema deve conceder o papel MARCA ao usuário. | POST /api/marcas/{id}/aprovar muda `Marca.status` para APROVADA e `Usuario.tipo` de CLIENTE para MARCA |
| REQ-USR-04 | Quando um ADMIN abre o painel, o sistema deve permitir gerenciar usuários pela interface. | Aba Usuários com listar, editar e excluir |
| REQ-USR-05 | Quando um ADMIN lista marcas, o sistema deve incluir o status de aprovação de cada uma. | GET /api/marcas → cada item com `status` (PENDENTE/APROVADA/REJEITADA) |
| REQ-USR-06 | Se o `id` de `/api/usuarios/[id]` ou de `POST /api/marcas/[id]/aprovar` não é um inteiro positivo (só dígitos, sem zeros à esquerda, até 2147483647), o sistema deve responder 400, depois de checar a sessão. | ADMIN com `id=abc` → 400; visitante → 403 |
| REQ-USR-07 | Quando uma atualização ou exclusão de usuário falha por inexistência, e-mail repetido ou vínculo com marca, o sistema deve responder 404, 409 e 409, respectivamente (nunca 500). | `PUT` de id inexistente → 404; `PUT` com e-mail de outro → 409; `DELETE` de usuário com marca → 409 |
| REQ-USR-08 | Se um ADMIN tenta excluir a própria conta, o sistema deve responder 409 e manter a conta. | `DELETE /api/usuarios/<meu id>` → 409 |

## Casos-limite

ADMIN pode excluir a si mesmo (a regra contrária não está especificada). E-mail duplicado na edição devolve 409 (a verificar).

## Interfaces

/api/usuarios e /api/usuarios/[id]. /api/marcas/[id]/aprovar (POST, ADMIN).

## NFRs aplicáveis

NFR-SEG-01.

## Fora de escopo

Convites por e-mail; auditoria de ações.

## Perguntas abertas

1. ADMIN pode excluir o próprio usuário ou o último ADMIN?
