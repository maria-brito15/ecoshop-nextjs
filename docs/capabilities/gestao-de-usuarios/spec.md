# USR · Gestão de usuários (ADMIN)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0017

## Objetivo

Permitir que ADMIN liste, crie, edite e exclua usuários e que, no futuro, aprove pedidos de MARCA.

## Atores

ADMIN.

## Regras de negócio

- **BR-USR-01** — A senha é sempre guardada com hash e nunca devolvida.
- **BR-USR-02** — Excluir um usuário que tem marca é restringido pelo banco.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-USR-01 | Quando um ADMIN lista usuários, o sistema deve devolver dados públicos (id, nome, e-mail, telefone, tipo, criadoEm), sem o hash da senha. | GET /api/usuarios por ADMIN → 200, sem campo senha |
| REQ-USR-02 | Quando um ADMIN cria um usuário válido, o sistema deve guardar a senha com hash e responder 201 sem o hash. | POST /api/usuarios → 201 e banco com hash bcrypt |
| REQ-USR-03 | Quando um ADMIN aprova um pedido de MARCA, o sistema deve conceder o papel MARCA ao usuário. | PUT de aprovação muda o tipo de CLIENTE para MARCA |
| REQ-USR-04 | Quando um ADMIN abre o painel, o sistema deve permitir gerenciar usuários pela interface. | Aba Usuários com listar, editar e excluir |

## Casos-limite

ADMIN pode excluir a si mesmo (a regra contrária não está especificada). E-mail duplicado na edição devolve 409 (a verificar).

## Interfaces

/api/usuarios e /api/usuarios/[id].

## NFRs aplicáveis

NFR-SEG-01.

## Fora de escopo

Convites por e-mail; auditoria de ações.

## Perguntas abertas

1. ADMIN pode excluir o próprio usuário ou o último ADMIN?
