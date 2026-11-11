# REF · Cadastros de referência (categorias, marcas, certificados)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0009 · ADR-0017

## Objetivo

Permitir que ADMIN mantenha os cadastros usados pelos produtos, preservando a integridade.

## Atores

ADMIN (escrita); todos (leitura, ver AUTZ-02).

## Regras de negócio

- **BR-REF-01** — Nomes de categoria, marca e certificado são únicos.
- **BR-REF-02** — Cada marca pertence a exatamente um usuário, e cada usuário tem no máximo uma marca.
- **BR-REF-03** — Não se exclui cadastro que tem produtos vinculados.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-REF-01 | Quando um ADMIN cria uma categoria válida, o sistema deve responder 201. | POST /api/categorias → 201 |
| REQ-REF-02 | Se o nome informado já existe, o sistema deve responder 409 ao criar categoria, marca ou certificado. | Nome duplicado → 409 |
| REQ-REF-03 | Se uma categoria, marca ou certificado tem vínculos, o sistema deve responder 409 ao excluí-lo. | DELETE de categoria com produtos → 409 |
| REQ-REF-04 | Se um ADMIN cria uma marca para um usuário que não é do tipo MARCA nem ADMIN, o sistema deve recusar. | POST /api/marcas com usuário CLIENTE → 409; com usuário inexistente → 404 |
| REQ-REF-05 | Se o `id` das rotas de categorias, marcas ou certificados não é um inteiro positivo, o sistema deve responder 400. | `abc`, `0`, `1.5` → 400 em GET, PUT e DELETE |

## Casos-limite

A criação de marca exige digitar o ID do usuário no painel. Alterar uma marca não invalida o cache de produtos (ver REQ-PROD-02).

## Interfaces

/api/categorias, /api/marcas, /api/certificados (+ /[id]) · painel (abas).

## NFRs aplicáveis

NFR-CONS-01.

## Fora de escopo

Hierarquia de categorias.

## Perguntas abertas

1. ~~O dono de uma marca precisa ser do tipo MARCA (REQ-REF-04)?~~ Decidido (2026-11-10): precisa ser MARCA ou ADMIN; `services/marca.service.ts` recusa CLIENTE com 409.
