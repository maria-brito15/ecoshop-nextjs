# Plano: 006-vinculo-produto-certificado

- **Spec:** ./spec.md
- **ADRs que segue:** nenhum específico · **ADRs novos/que substitui:** nenhum

## Abordagem técnica

1. `lib/schemas/product.ts`: `atualizarProdutoSchema` ganha `certificadoIds?: number[]` (array de inteiros, opcional).
2. `services/product.service.ts::atualizarProduto`: separa `certificadoIds` do resto do corpo (`produtoData`). Dentro de um `prisma.$transaction`: atualiza os campos escalares (se houver algum) ou só confirma que o produto existe (`findUniqueOrThrow`, garante 404 mesmo quando só `certificadoIds` é enviado); se `certificadoIds !== undefined`, remove todo o vínculo atual (`produtoCertificado.deleteMany`) e cria o novo, deduplicado (`produtoCertificado.createMany`); devolve o produto com `certificados` incluído.
3. `app/api/produtos/[id]/route.ts`: só documentação — a validação e o repasse ao service já eram genéricos.
4. `types/api.ts`: `AtualizarProdutoBody` ganha `certificadoIds?: number[]`.
5. Painel (`app/(admin)/painel/page.tsx`, `SecaoProdutos`): estado `certificadoIds`; ao abrir "Editar", pré-marca os certificados já vinculados (`produto.certificados.map(pc => pc.certificado.id)`); checklist de certificados visível só no modo edição (criação não tem produto ainda); `handleSalvar` manda `certificadoIds` só no PUT.

Alternativa descartada: endpoint dedicado (`POST/DELETE /api/produtos/{id}/certificados`). Rejeitada porque o critério de aceite já pedido pelo dono é explicitamente "PUT com certificadoIds atualiza o vínculo" — um endpoint novo seria escopo além do pedido.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | sim | REQ-PROD-05: substituição completa, remoção total (`[]`), e id inexistente não é 500 |
| V Camadas | sim | sim | handler chama `services/`; transação fica no service |
| VII Erros | sim | sim | `certificadoId` inexistente mapeado a 409 (`mapeiaErroPrisma`, P2003), não 500 |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `lib/schemas/product.ts` | `certificadoIds` em `atualizarProdutoSchema` | REQ-PROD-05 |
| `services/product.service.ts` | `atualizarProduto` substitui o vínculo numa transação | REQ-PROD-05 |
| `app/api/produtos/[id]/route.ts` | doc do novo campo | REQ-PROD-05 |
| `types/api.ts` | `AtualizarProdutoBody.certificadoIds` | REQ-PROD-05 |
| `app/(admin)/painel/page.tsx` | checklist de certificados no modal de edição de produto | REQ-PROD-05 |
| `tests/integration/catalog.test.ts` | 2 testes novos | REQ-PROD-05 |
| `docs/capabilities/gestao-de-produtos/{spec,status}.md` | REQ-PROD-05 ❌→✅ | REQ-PROD-05 |
| `docs/architecture/adr/pendentes.md` | remove a linha do backlog | — |

## Plano de verificação

Integração (`tests/integration/catalog.test.ts`): substituir vínculo (2 certificados → 1 → nenhum) e confirmar o array devolvido em cada etapa; `certificadoId` inexistente não gera 500. REQ-PROD-01 a 04 continuam passando sem alteração. Manual: não feito (sem navegador nesta sessão), mas a lógica decisiva está na API, coberta por teste; a UI só reflete o que a API já faz.

## Riscos e reversão

Risco: a transação ficar parcialmente aplicada se a criação falhar no meio do `createMany`. Mitigado pelo próprio `$transaction` (atomicidade do Postgres — se `createMany` falhar por FK, o `deleteMany` anterior também é revertido). Reversão: remover `certificadoIds` do schema e do service (a coluna/tabela não muda, só volta a não ser editável pela API).

## Complexity Tracking

Sem violações.
