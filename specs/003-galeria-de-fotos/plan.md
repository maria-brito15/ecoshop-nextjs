# Plano: 003-galeria-de-fotos

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0011 (fotos no filesystem local) · **ADRs novos/que substitui:** nenhum

## Abordagem técnica

A API e o armazenamento já suportam várias fotos por produto (ADR-0011, REQ-MIDIA-01/02/03, todos ✅). Só a tela não usava isso. `app/(store)/produtos/[id]/page.tsx` já chama `useBuscarProduto`; adiciono `useListarFotos(Number(id))` (hook já existente, sem mudança em `lib/hooks/useFotos.ts`) e um estado `fotoSelecionada`. A imagem principal passa a ser `fotoSelecionada ?? produto.fotoUrl ?? fotos[0]?.url ?? null`, e uma faixa de miniaturas (uma por foto) aparece abaixo da imagem principal quando `fotos.length > 0`; clicar numa miniatura troca `fotoSelecionada`.

Alternativa descartada: um componente de carrossel de terceiros. Rejeitada por ser um add-on desproporcional para uma galeria de miniaturas simples, e por introduzir uma dependência nova sem necessidade.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | parcial | sem suíte de teste de componente no projeto (ADR-0016 cobre só API); verificado via API real (`curl`) e código; falta manual com navegador |
| V Camadas | sim | sim | página só consome hooks existentes, nenhuma chamada direta a `lib/db` ou ao filesystem |
| XI Sem dado inventado | sim | sim | a galeria só mostra fotos reais devolvidas pela API |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `app/(store)/produtos/[id]/page.tsx` | consome `useListarFotos`; estado `fotoSelecionada`; faixa de miniaturas | REQ-MIDIA-04 |
| `docs/capabilities/midia-de-produto/{spec,status}.md` | REQ-MIDIA-04 ❌→◐ (código + API verificada; falta manual no navegador) | REQ-MIDIA-04 |
| `docs/architecture/adr/pendentes.md` | remove a linha da galeria do backlog | — |

## Plano de verificação

API: `GET /api/produtos/{id}/fotos` já cobertas por REQ-MIDIA-01/02/03; confirmado também ao vivo contra o dev server com um produto de 2 fotos (`total: 2`, URLs corretas). Manual pendente: abrir `/produtos/{id}` no navegador com um produto de 3+ fotos e confirmar que aparecem 3 miniaturas clicáveis que trocam a imagem principal — não feito nesta sessão por falta de ferramenta de navegador.

## Riscos e reversão

Risco: produto sem fotos extras perde alguma coisa? Não — `fotos.length === 0` mantém o comportamento atual (só `fotoUrl` ou ícone). Reversão: remover o bloco de miniaturas e o import de `useListarFotos` (não toca em API nem banco).

## Complexity Tracking

Sem violações.
