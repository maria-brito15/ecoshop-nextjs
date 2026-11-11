# CAT · Catálogo de produtos (vitrine)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-11. ADRs: ADR-0004 · ADR-0009 · ADR-0018

## Objetivo

Permitir que visitantes encontrem produtos sustentáveis e vejam seus detalhes e certificações.

## Atores

Visitante · CLIENTE · MARCA · ADMIN (todos leem).

## Regras de negócio

- **BR-CAT-01** — Preço é decimal positivo com 2 casas e é exibido como número.
- **BR-CAT-02** — O catálogo é uma vitrine: não há carrinho, pedido nem pagamento (fora de escopo).

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-CAT-01 | Quando um visitante abre o catálogo, o sistema deve listar produtos em páginas de 12 itens, com o total de resultados. | GET /api/produtos?nome=X → total 14, 12 itens na página 1, 2 na página 2 |
| REQ-CAT-02 | Quando o visitante informa um termo de busca, o sistema deve devolver apenas produtos cujo nome contém o termo, sem diferenciar maiúsculas e minúsculas. | Busca em maiúsculas encontra os 14 produtos |
| REQ-CAT-03 | Quando o visitante filtra por categoria, o sistema deve devolver somente produtos dela. | categoriaId=N → só produtos da categoria N |
| REQ-CAT-04 | Se o produto pedido não existe, o sistema deve responder 404. | GET /api/produtos/99999999 → 404 |
| REQ-CAT-05 | Se page ou size são inválidos ou size passa de 100, o sistema deve responder 400. | size=1000 → 400; page=abc → 400 |
| REQ-CAT-06 | Quando o visitante ordena por preço ou nome, ou limita o preço máximo, o sistema deve aplicar a ordenação e o limite ao catálogo inteiro, não apenas à página exibida. | Ordenar por preço crescente → o primeiro item da página 1 é o mais barato de todos |
| REQ-CAT-07 | Quando o visitante filtra por marca, o sistema deve devolver somente produtos dela. | marcaId=N → só produtos da marca N |
| REQ-CAT-08 | Quando o visitante abre um produto, o sistema deve exibir nome, descrição, preço, categoria, marca e seus certificados. | GET /api/produtos/[id] inclui categoria, marca e certificados |
| REQ-CAT-09 | Se o `id` de `GET /api/produtos/[id]` não é um inteiro positivo, o sistema deve responder 400. | `abc`, `0`, `-1`, `1.5`, `1e3`, `2147483648` → 400 (não 500) |
| REQ-CAT-10 | O sistema deve montar a chave de cache da listagem a partir dos filtros validados, em ordem fixa e só com os parâmetros conhecidos (a busca por `nome` ignora caixa e espaços das pontas e tem no máximo 100 caracteres; mais que isso → 400). | Ordem dos parâmetros e parâmetros desconhecidos não mudam a chave; `nome` de 101 caracteres → 400 |

## Casos-limite

Produto sem foto mostra placeholder (fotoUrl vazio). Lista cacheada por 2 min (NFR-CONS-01). O painel administrativo pede size=100 (limite do REQ-CAT-05 deve acomodá-lo).

## Interfaces

GET /api/produtos?page&size&nome&categoriaId&marcaId&precoMax&sort · GET /api/produtos/[id] · páginas /produtos e /produtos/[id].

## NFRs aplicáveis

NFR-DES-01, NFR-CONS-01.

## Fora de escopo

Carrinho, pedido, pagamento, estoque, avaliações.

## Perguntas abertas

Nenhuma. REQ-CAT-06 e REQ-CAT-07 foram implementados em 2026-11-11 (`specs/005-filtro-marca-ordenacao-preco/spec.md`).
