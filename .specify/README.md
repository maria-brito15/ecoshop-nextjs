# .specify/ — estrutura do Spec Kit neste projeto

Esta pasta segue a convenção documentada do GitHub Spec Kit (`memory/constitution.md`, `templates/`, specs de mudança em `specs/NNN-nome/`).

**Importante (ADR-0002):** esta estrutura foi **escrita à mão**, não gerada por `specify init`, porque o ambiente em que foi criada não tinha acesso ao repositório do Spec Kit. Antes de usar os comandos `/speckit.*` pela primeira vez:

1. Fixe uma versão e rode `specify init --here --integration claude` **numa cópia** do projeto.
2. Compare o resultado com esta pasta; preserve `memory/constitution.md` e as adaptações dos templates (IDs `REQ-<CAP>-NN`, "Delta na spec viva", coluna REQ nas tarefas).
3. Registre a versão e as diferenças no ADR-0002.

| Caminho | Função |
|---|---|
| `memory/constitution.md` | Constitution (fonte única; lida por `/speckit.plan` no "Constitution Check") |
| `templates/spec-template.md` | Esqueleto de `specs/NNN-*/spec.md` |
| `templates/plan-template.md` | Esqueleto de `plan.md` (com Constitution Check) |
| `templates/tasks-template.md` | Esqueleto de `tasks.md` (cada tarefa liga a REQ e teste) |
