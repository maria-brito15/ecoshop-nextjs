# Spec Kit oficial × projeto (coletado em 2026-11-10)

- CLI: `specify` **1.2.0** (já instalado; Python 3.13.5).
- Comando: `specify init . --integration claude --force --non-interactive` em `/tmp/ecoshop-sk` (diretório vazio, fora do repositório). `--ai claude` (do pedido) e `--no-git` **não existem** na 1.2.0; usei `--integration claude`.
- Nada foi copiado para o repositório. O "clone temporário" foi um diretório vazio, não um clone do projeto; a comparação é arquivos gerados × arquivos existentes.

## O que o oficial gera e o projeto não tem
- `.claude/skills/speckit-{specify,plan,tasks,implement,clarify,analyze,checklist,constitution,converge,taskstoissues}/SKILL.md`. Os comandos são **skills** chamadas `/speckit-*` (com hífen, não `/speckit.*`). O projeto não tem nenhuma.
- `.specify/scripts/powershell/` (`check-prerequisites`, `common`, `create-new-feature`, `resolve-template`, `setup-plan`, `setup-tasks`).
- `.specify/workflows/speckit/workflow.yml` e `workflow-registry.json`.
- `.specify/templates/checklist-template.md` e `constitution-template.md`.
- `.specify/init-options.json`, `integration.json`, `integrations/*.manifest.json`, `memory/.constitution-template.json`, `.specify/.gitignore`.

## O que o projeto tem e o oficial não gera
`.specify/README.md`, `.claude/agents/*` (drift-auditor, spec-reviewer, verifier), `.claude/rules/*`, `.claude/settings.json` e 6 skills próprias (brownfield-discovery, requirements-engineering, software-architecture, spec-driven-development, technical-writing, test-strategy).

## Templates
| Template | Projeto | Oficial |
|---|---|---|
| spec | 35 linhas, PT: Problema, Fora de escopo, Comportamento atual (com evidência), Requisitos EARS, Cenários, Regras de negócio, Interfaces afetadas, Delta na spec viva, Perguntas em aberto | 131 linhas, EN: User Scenarios (P1–P3), Edge Cases, Functional Requirements, Key Entities, Success Criteria, Assumptions |
| plan | 35 linhas: Abordagem, Constitution Check, Arquivos afetados, Contratos/modelo, Verificação, Riscos e reversão | 113 linhas: Summary, Technical Context, Constitution Check, Project Structure (opções 1–3) |
| tasks | 9 linhas | 252 linhas: fases (Setup, Foundational, uma por User Story, Polish), `[ID] [P] [Story]`, dependências, estratégia MVP |

Diferença de fundo: o do projeto é brownfield (comportamento atual + delta na spec viva); o oficial é greenfield orientado a user stories.

## Constitution
A oficial é um template com placeholders (`[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`...). A do projeto é preenchida.

## Comandos (1.2.0)
Principais: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`. Opcionais: `/speckit-clarify`, `/speckit-analyze`, `/speckit-checklist`. Também gerados: `/speckit-converge` e `/speckit-taskstoissues` (conteúdo não lido).
