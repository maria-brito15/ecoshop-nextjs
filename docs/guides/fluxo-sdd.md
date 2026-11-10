# Fluxo SDD passo a passo

Referências: ADR-0001, Constitution (`.specify/memory/constitution.md`), skill `spec-driven-development`.

## 1. Escolha a trilha
| Situação | Trilha |
|---|---|
| Comportamento novo | Completa |
| Código viola uma spec existente | Correção |
| O comportamento correto é diferente da spec | Correção com mudança de regra |
| Refatoração, docs, infra | Sem comportamento |

Descubra o impacto: `node scripts/sdd/impact-map.mjs --worktree`.

## 2. Trilha completa (exemplo: `specs/001-perfil-proprio-usuario`)
1. Crie `specs/NNN-nome/` com `spec.md`, `plan.md`, `tasks.md` a partir de `.specify/templates/`.
2. **G1:** o dono aprova a spec (revise com o agent `spec-reviewer`).
3. **G2:** o dono aprova o plano e os ADRs.
4. Para cada tarefa: teste `REQ-…` falhando → código → teste passando → commit.
5. **G3:** `npm run lint && npx tsc --noEmit && npm test && npm run sdd:check`.
6. Consolide `docs/capabilities/<cap>/spec.md` e `status.md` (evidência e data).
7. **G4:** PR com o template preenchido; CI verde. Após o merge, `specs/NNN` fica imutável.

## 3. Trilha correção
Escreva o teste que falha com o ID do REQ (ou crie o REQ), corrija, atualize `status.md` (❌→✅), PR.

## 4. Onde cada coisa mora
Regras gerais: Constitution · comportamento: `docs/capabilities` · decisões: `docs/architecture/adr` · mudanças: `specs/` · retrato histórico: `docs/discovery`.

## 5. Rotina
Todo PR: CI + template. Mensal: workflow `sdd-drift` abre uma issue. Fim de fase: reveja a Constitution e registre em `docs/learning/`.
