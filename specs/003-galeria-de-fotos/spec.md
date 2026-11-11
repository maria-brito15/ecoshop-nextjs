# Spec de mudança: 003-galeria-de-fotos

- **Trilha:** correção (o código viola REQ-MIDIA-04; a regra já existe na spec, só falta a UI — decidido pelo dono em 2026-11-10)
- **Capacidades afetadas:** MIDIA (`docs/capabilities/midia-de-produto`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (feature escolhida do backlog em 2026-11-10; sem decisão de arquitetura nova) · **Data:** 2026-11-10

## Problema

A página de produto (`/produtos/[id]`) só exibe `produto.fotoUrl` (uma imagem). O backend já suporta várias fotos por produto (`GET /api/produtos/{id}/fotos`, `ADR-0011`, testado por REQ-MIDIA-01/02/03) e já existe o hook `useListarFotos`, mas nenhuma tela usa essa lista para mostrar uma galeria — REQ-MIDIA-04 está ❌.

## Fora de escopo

- Qualquer mudança no backend/armazenamento de fotos (já funciona, cobre REQ-MIDIA-01/02/03).
- Redimensionamento, CDN, upload múltiplo de uma vez (já fora de escopo da capacidade).
- Reordenar fotos ou marcar uma como "principal" (`fotoUrl` continua sendo a imagem inicial exibida).

## Comportamento atual (fato, com evidência)

- `app/(store)/produtos/[id]/page.tsx:257-271`: renderiza só `produto.fotoUrl`, sem chamar `useListarFotos`.
- `lib/hooks/useFotos.ts:40-42`: `useListarFotos(produtoId)` já existe e chama `GET /api/produtos/{id}/fotos`.
- `docs/capabilities/midia-de-produto/status.md:12`: REQ-MIDIA-04 ❌, em backlog.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-MIDIA-04 | Quando o produto tem várias fotos, o sistema deve exibir a galeria na página do produto. | Produto com 3 fotos mostra 3 miniaturas clicáveis que trocam a imagem principal | Já existe (❌→✅) |

## Cenários e casos-limite

- Produto sem fotos extras (`fotos.length === 0`): mostra só `fotoUrl` (ou o ícone de fallback), sem faixa de miniaturas — comportamento atual preservado.
- Produto com fotos mas sem `fotoUrl`: a primeira foto da lista vira a imagem principal inicial.
- Clique numa miniatura: troca a imagem principal exibida, sem navegação de página.

## Regras de negócio e restrições

- Nenhuma nova; reaproveita BR-MIDIA-01 (armazenamento em filesystem) e o endpoint já testado.
- Constitution Art. XI: nenhum dado inventado — a galeria só mostra fotos reais vindas da API.

## Interfaces afetadas

`app/(store)/produtos/[id]/page.tsx` (consome `useListarFotos`, já existente).

## Delta na spec viva

`midia-de-produto/status.md`: REQ-MIDIA-04 ❌→✅ (teste/manual). `pendentes.md`: remove a linha da galeria de "Funcionalidades decididas, ainda não construídas".

## Perguntas em aberto

Nenhuma bloqueante.
