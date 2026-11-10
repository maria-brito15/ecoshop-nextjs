# 10 · Roadmap de implementação por fases e critérios de sucesso

## Lógica da ordem

1. Primeiro, **destravar o que já está quebrado na infraestrutura de engenharia** (CI sem lint funcional, migrations ignoradas pelo git), porque nenhum gate funciona sem isso.
2. Depois, **o mínimo de Claude Code** para fazer o baseline com rigor (não tudo).
3. Então **conhecimento** (produto, decisões) antes de **verificação** (testes), e testes antes de **specs com status**, porque status ✅ exige teste.
4. Automação de governança só depois que há artefatos para governar.
5. Por fim, **uma mudança real ponta a ponta** para provar o fluxo, e só então evoluir o produto.

Estimativas em horas de trabalho focado, para alguém aprendendo enquanto faz. Cada fase termina num PR revisado por você e numa entrada em `docs/learning/`.

---

## Fase 0 · Validação do diagnóstico (G0)

| | |
|---|---|
| **Objetivo** | Você confirmar ou corrigir fatos, inferências e responder às dúvidas |
| **Justificativa** | Tudo o que vem depois (overview, papéis, escopo) depende de respostas que só você tem |
| **Atividades** | Ler `00`–`02`; responder as 8 dúvidas do diagnóstico; aprovar/ajustar a Constitution proposta; decidir sobre os defeitos críticos (ver "Decisão pedida" no fim) |
| **Arquivos** | Nenhum no repo; este pacote é atualizado com as respostas |
| **Dependências** | — |
| **Concluída quando** | Dúvidas respondidas ou explicitamente aceitas como abertas |
| **Esforço** | 1–2 h (sua) |
| **Riscos** | Seguir sem as respostas leva a specs que inventam intenção |

## Fase 1 · Fundação do processo e do pipeline

| | |
|---|---|
| **Objetivo** | Ter um repositório versionado em que gates conseguem existir |
| **Justificativa** | O CI hoje falha no lint (D10); migrations novas seriam ignoradas; não há onde registrar decisões |
| **Atividades** | Repositório git com histórico (ou importar o existente); instalar Spec Kit **com versão fixada** e registrar a estrutura gerada; Constitution aprovada em `.specify/memory/`; ADR-0001 (SDD), ADR-0002 (Spec Kit), ADR-P10 (ESLint flat + Prettier); corrigir `.gitignore` para migrations; remover `prisma/schema.txt`; alinhar versão de Node (`.nvmrc` + `engines`); template de PR; `docs/README.md` e `docs/discovery/2026-11-baseline/` com este pacote |
| **Arquivos** | `.specify/**`, `docs/architecture/adr/0000-0002`, `eslint.config.mjs`, `.prettierrc`, `package.json` (scripts e devDeps), `.gitignore`, `.nvmrc`, `.github/pull_request_template.md`, `.github/workflows/ci.yml` (lint real), `docs/**` |
| **Dependências** | Fase 0 |
| **Concluída quando** | CI verde com lint de verdade; `specify` funcionando no Claude Code; Constitution v1.0.0 com status aprovado |
| **Esforço** | 5–8 h |
| **Riscos** | O lint vai revelar dezenas de avisos: configurar como aviso o que não for erro e tratar em PRs "sem comportamento", sem refatorar em massa; mudança de comandos do Spec Kit entre versões |

## Fase 2 · Claude Code essencial

| | |
|---|---|
| **Objetivo** | Ter o ferramental mínimo para fazer o baseline com consistência |
| **Justificativa** | O baseline (Fases 3 e 5) é trabalho repetitivo por capacidade; sem skills, cada capacidade sai num formato |
| **Atividades** | `CLAUDE.md` (esqueleto do doc 08); adaptar as 4 skills; criar `brownfield-discovery`; agent `spec-reviewer`; rules `sdd-docs.md` e `api-routes.md`; hook de bloqueio de comandos destrutivos e de edição de Constitution/ADR aceito |
| **Arquivos** | `CLAUDE.md`, `.claude/skills/{requirements-engineering,software-architecture,spec-driven-development,technical-writing,brownfield-discovery}/**`, `.claude/agents/spec-reviewer.md`, `.claude/rules/*.md` (2), `.claude/settings.json` |
| **Dependências** | Fase 1 |
| **Concluída quando** | Cada skill acionada uma vez num exercício e ajustada; `spec-reviewer` revisou uma spec de teste sem acesso ao código |
| **Esforço** | 6–9 h |
| **Riscos** | Skills longas demais; descrições que não disparam. Mitigação: corpo < 200 linhas, detalhe em `references/` |

## Fase 3 · Baseline de produto e arquitetura

| | |
|---|---|
| **Objetivo** | Registrar o que o produto é e por que é como é |
| **Justificativa** | Specs de capacidade precisam de glossário, escopo e NFRs; agentes precisam saber quais decisões são intencionais |
| **Atividades** | `docs/product/*` (overview com escopo/fora de escopo, glossário, modelo de domínio, NFRs, restrições, interfaces externas); ADRs inferidos 0003–0014; `docs/architecture/overview.md`; README enxuto apontando para `docs/` (removendo promessas que o código não cumpre) |
| **Arquivos** | `docs/product/**`, `docs/architecture/**`, `README.md`, `README-en.md` |
| **Dependências** | Fases 0, 2 |
| **Concluída quando** | `spec-reviewer` sem achado bloqueante no overview; todos os ADRs inferidos com status e evidência; README sem afirmação não verificada |
| **Esforço** | 8–12 h |
| **Riscos** | Escrever ADR inferido como se fosse decisão aprovada; transformar o overview em marketing |

## Fase 4 · Rede de segurança de testes

| | |
|---|---|
| **Objetivo** | Poder afirmar com evidência o que o sistema faz hoje |
| **Justificativa** | Status ✅ exige teste (C-II); qualquer correção futura precisa de rede |
| **Atividades** | ADR-P08 (ferramentas); infraestrutura de teste (Vitest, Postgres em container no CI, dublês de Azure/Gemini/Redis); skill `test-strategy`; **testes de caracterização** das capacidades P1 (AUTZ, AUTH, PERF, OPS), incluindo os que documentam defeitos (marcados como `todo/failing` com o ID do defeito); passo de teste no CI |
| **Arquivos** | `vitest.config.ts`, `tests/integration/**`, `tests/fixtures/**`, `*.test.ts` junto de services/schemas/parsers, `.claude/skills/test-strategy/**`, `.claude/rules/tests.md`, `ci.yml`, `package.json` |
| **Dependências** | Fase 1 (CI), Fase 3 (NFRs ajudam a escolher casos) |
| **Concluída quando** | CI roda testes de unidade e integração; cada defeito P1 (D1–D6) tem um teste que o reproduz |
| **Esforço** | 10–14 h |
| **Riscos** | Testes que "fotografam" o defeito como se fosse correto. Mitigação: teste de caracterização de defeito é marcado como falha esperada, não como comportamento aprovado |

## Fase 5 · Specs de capacidade (spec viva) e rastreabilidade

| | |
|---|---|
| **Objetivo** | Fonte de verdade de comportamento para todas as capacidades, ligada a testes |
| **Justificativa** | É o coração do SDD neste projeto (doc 03, seção 2) |
| **Atividades** | Escrever `spec.md` + `status.md` das 12 capacidades na ordem do doc 05 (P1 → P2 → P3), cada uma revisada pelo `spec-reviewer` e aprovada por você; `sdd.config.json`; `spec-lint.mjs`, `trace-check.mjs`, `adr-index.mjs` no CI; testes de caracterização das P2 conforme a spec pede |
| **Arquivos** | `docs/capabilities/**`, `sdd.config.json`, `scripts/sdd/{spec-lint,trace-check,adr-index}.mjs`, `ci.yml`, novos testes |
| **Dependências** | Fases 3, 4 |
| **Concluída quando** | 12 specs aprovadas; `trace-check` verde no CI; tabela agregada de status gerada |
| **Esforço** | 15–22 h (é a maior fase; pode ser feita capacidade a capacidade, em PRs separados) |
| **Riscos** | Specs que descrevem a implementação; fadiga. Mitigação: começar pelas P1 e fazer uma retrospectiva após as 3 primeiras |

## Fase 6 · Governança automatizada

| | |
|---|---|
| **Objetivo** | Tornar o drift visível sem depender de memória |
| **Justificativa** | Com specs e testes existindo, agora há o que proteger |
| **Atividades** | `impact-map.mjs` + caminhos sensíveis → ADR; hooks PostToolUse/Stop/SessionStart; agents `verifier` e `drift-auditor`; rules restantes; workflow agendado mensal que abre issue |
| **Arquivos** | `scripts/sdd/impact-map.mjs`, `.claude/settings.json`, `.claude/agents/{verifier,drift-auditor}.md`, `.claude/rules/*`, `.github/workflows/sdd-drift.yml` |
| **Dependências** | Fase 5 |
| **Concluída quando** | Um PR de teste que muda `middleware.ts` sem citar ADR falha no CI; o relatório mensal roda uma vez |
| **Esforço** | 6–10 h |
| **Riscos** | Hooks barulhentos que você passa a ignorar. Mitigação: hooks só informam, quem bloqueia é o CI |

## Fase 7 · Piloto: primeira mudança pelo fluxo completo

| | |
|---|---|
| **Objetivo** | Provar o fluxo ponta a ponta numa mudança real e aprender com ele |
| **Justificativa** | Um processo que nunca rodou numa mudança real é hipótese |
| **Atividades** | `specs/001-perfil-proprio-usuario` (D1 + D2) passando por todos os gates; ADR que resolve P01 (substitui 0008); consolidação na spec viva; retrospectiva: o que foi cerimônia, o que salvou erro |
| **Arquivos** | `specs/001-*/**`, `docs/architecture/adr/0015-*`, código de autorização e usuário, testes, `docs/capabilities/{autorizacao,conta-e-perfil}/**`, `docs/learning/` |
| **Dependências** | Fase 6 (ou Fase 5, se quiser pilotar mais cedo) |
| **Concluída quando** | PR mesclado com todos os gates; REQ-PERF-01 ✅ com teste; retrospectiva escrita |
| **Esforço** | 5–8 h |
| **Riscos** | Descobrir que o fluxo é pesado demais para correções; ajustar trilhas (é um resultado válido) |

## Fase 8 · Evolução controlada (contínua)

Backlog de mudanças, cada uma pelo fluxo: D3 chat (depois da decisão), D5/D6 seeds, D4 Gemini, D7 exclusões, D9 paginação, ADRs pendentes P02–P07, decomposição das páginas grandes, e então as **novas funcionalidades e trocas de tecnologia** que você planeja.

## Resumo

| Fase | Entregável principal | Esforço | Depende de |
|---|---|---|---|
| 0 | Diagnóstico validado | 1–2 h | — |
| 1 | CI funcional, Spec Kit, Constitution, ADRs de processo | 5–8 h | 0 |
| 2 | CLAUDE.md, 5 skills, spec-reviewer, hooks de proteção | 6–9 h | 1 |
| 3 | docs/product, ADRs inferidos, README honesto | 8–12 h | 0, 2 |
| 4 | Testes de caracterização + CI de testes | 10–14 h | 1, 3 |
| 5 | 12 specs vivas + rastreabilidade no CI | 15–22 h | 3, 4 |
| 6 | Governança automatizada e drift | 6–10 h | 5 |
| 7 | Piloto ponta a ponta (perfil) | 5–8 h | 6 |
| **Total até o piloto** | | **≈ 56–85 h** | |

---

## Critérios de sucesso da transformação

A transformação está concluída quando **todos** abaixo forem verdade e verificáveis:

### Fonte de verdade
1. Toda capacidade listada em `docs/capabilities/README.md` tem `spec.md` aprovada e `status.md` com evidência por REQ.
2. README não contém afirmação de comportamento que não esteja numa spec ou não seja verificável.
3. Toda decisão inferida está registrada como ADR com status explícito; nenhuma spec ou plano cita ADR substituído.

### Verificação
4. CI executa lint, typecheck, testes (unidade + integração), build, `spec-lint` e `trace-check`, e bloqueia merge em falha.
5. 100% dos REQ com status ✅ têm teste com o ID; 0 testes citam REQ inexistente.
6. Todos os defeitos D1–D10 estão corrigidos **ou** registrados como REQ ❌ com spec de mudança planejada, ou aceitos por ADR.

### Processo
7. Pelo menos uma mudança (o piloto) passou por G1–G4 com artefatos completos em `specs/001-*`.
8. Uma mudança em caminho sensível sem ADR citado é barrada pelo CI (testado de propósito).
9. O relatório de drift agendado rodou ao menos uma vez e suas descobertas foram triadas.

### Claude Code
10. As skills, rules, agents e hooks têm função única, sem instrução duplicada (verificável lendo: cada regra aparece em um lugar e é referenciada nos outros).
11. Um agente numa sessão nova, só com o repositório, consegue responder "como o perfil deve se comportar e como sei que funciona?" citando spec, ADR e teste.

### Aprendizado
12. `docs/learning/` tem uma entrada por fase explicando o problema que cada artefato resolveu (ou não) na prática.

---

## Decisão pedida antes da Fase 1

Os defeitos D2 (hash de senha na resposta) e D3 (chat público consumindo cota) são riscos reais se houver produção. Duas opções:

- **A (recomendada se houver produção):** corrigi-los já, pela trilha "Correção", com teste mínimo, antes da Fase 1. Custo: ~2 h; fura levemente a ordem, mas não a Constitution (teste antes da correção).
- **B (se não houver produção):** deixá-los para o piloto/Fase 8, pelo fluxo completo, como material de aprendizado.
