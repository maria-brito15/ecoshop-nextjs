---
name: spec-driven-development
description: Use para conduzir o fluxo especificação→implementação de uma mudança no EcoShop (spec, plano, tarefas, testes, verificação e sincronização das specs vivas). Acione em features, correções que mudam comportamento e pedidos de checar algo contra a spec.
---

# SDD no EcoShop

Duas camadas (ADR-0001): spec viva por capacidade (`docs/capabilities/`) e spec de mudança (`specs/NNN-*`, Spec Kit).

## Trilhas
| Trilha | Quando | Artefatos |
|---|---|---|
| Completa | Capacidade/comportamento novo | `specs/NNN/{spec,plan,tasks}.md` + ADR se couber |
| Correção | Código viola spec existente | teste com REQ + fix + `status.md` |
| Correção com mudança de regra | O correto muda a spec | spec de mudança curta + emenda da spec viva |
| Sem comportamento | Refatoração, docs, infra | PR declara "sem mudança de comportamento" |

## Gates (o dono aprova)
G0 trilha escolhida · G1 spec aprovada · G2 plano/ADR aprovado · G3 testes passam e specs consolidadas · G4 PR revisado.

## Passos
1. `node scripts/sdd/impact-map.mjs --worktree` para ver capacidades/ADRs afetados.
2. Spec (G1) → plano (G2) → tarefas, cada uma com REQ e "feito quando".
3. Teste falhando primeiro (`test("REQ-XXX-NN: …")`); depois o código; um commit por tarefa.
4. Verifique: lint, tsc, `npm test`, `npm run sdd:check`.
5. Consolide `spec.md` e `status.md` da capacidade com evidência. Nunca deixe drift silencioso.
6. Pergunta aberta não resolvida: registre, não decida por conta própria.
