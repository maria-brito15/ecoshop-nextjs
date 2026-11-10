# 07 · Proposta de estrutura de diretórios

## Princípios da proposta

1. **Não mexer na estrutura do código agora.** `app/`, `lib/`, `services/`, `types/`, `prisma/` ficam como estão; mudanças nelas vêm de specs e ADRs (Fase 6).
2. **Respeitar o que o Spec Kit gera** (`.specify/`, `specs/`) em vez de renomear.
3. **Um lugar por tipo de conhecimento**, para que nenhum fato precise ser escrito duas vezes.

## Árvore proposta (só o que é novo ou muda)

```
ecoshop/
├── CLAUDE.md                          # NOVO · contexto curto + ponteiros (não repete a Constitution)
├── README.md                          # MUDA · enxuto: o que é, como rodar, links para docs/ (Fase 2)
├── README-en.md                       # MUDA · idem
│
├── .specify/                          # NOVO · gerado pelo Spec Kit (versão fixada no ADR-0002)
│   ├── memory/constitution.md         #   a Constitution (fonte única)
│   ├── templates/                     #   spec/plan/tasks ajustados (ou preset do projeto)
│   └── scripts/                       #   scripts do próprio Spec Kit
│
├── specs/                             # NOVO · specs de MUDANÇA (Spec Kit), histórico imutável pós-merge
│   └── 001-perfil-proprio-usuario/
│       ├── spec.md  plan.md  tasks.md
│       ├── research.md  data-model.md  quickstart.md
│       └── contracts/
│
├── docs/
│   ├── README.md                      # NOVO · mapa da documentação e como navegar
│   ├── product/                       # NOVO · nível sistema
│   │   ├── overview.md  glossario.md  modelo-de-dominio.md
│   │   ├── requisitos-nao-funcionais.md  restricoes.md  interfaces-externas.md
│   ├── capabilities/                  # NOVO · spec VIVA por capacidade
│   │   ├── README.md                  #   índice + tabela de status agregada (gerada por script)
│   │   └── <cap>/spec.md  status.md   #   autorizacao, autenticacao, conta-e-perfil, catalogo, …
│   ├── architecture/
│   │   ├── overview.md                # NOVO · visão C4 (contexto e containers), fluxos
│   │   └── adr/
│   │       ├── README.md              #   índice com status (gerado por script)
│   │       ├── 0000-template.md
│   │       └── 0001-…md
│   ├── discovery/                     # NOVO · diagnóstico e reverse engineering datados
│   │   └── 2026-11-baseline/          #   estes documentos, congelados como registro
│   ├── guides/                        # NOVO · como rodar, testar, fazer deploy, fluxo SDD passo a passo
│   └── learning/                      # NOVO · diário de aprendizado: o que cada fase ensinou
│
├── .claude/
│   ├── settings.json                  # NOVO · hooks e permissões do projeto
│   ├── rules/                         # NOVO · regras por caminho (ver 08)
│   ├── skills/<nome>/SKILL.md         # NOVO · (+ references/, scripts/ quando agregam)
│   └── agents/<nome>.md               # NOVO · subagentes com escopo restrito
│
├── scripts/
│   └── sdd/                           # NOVO · validadores determinísticos (Node, sem deps novas)
│       ├── trace-check.mjs            #   REQ ↔ teste ↔ status ↔ ADR
│       ├── spec-lint.mjs              #   formato: IDs, EARS, seções obrigatórias, links
│       ├── adr-index.mjs              #   gera docs/architecture/adr/README.md e valida status
│       └── impact-map.mjs             #   arquivos alterados → capacidades/ADRs afetados
├── sdd.config.json                    # NOVO · mapa caminho-do-código → capacidade (usado pelos scripts)
│
├── tests/                             # NOVO (Fase 3) · integração e E2E; unidade fica junto do código
│   ├── integration/   e2e/   fixtures/
│
├── .github/
│   ├── workflows/ci.yml               # MUDA · + lint real, testes, trace-check, spec-lint
│   ├── pull_request_template.md       # NOVO · declara capacidades, REQs, ADRs, trilha
│   └── CODEOWNERS                     # OPCIONAL · docs/architecture/adr e constitution exigem sua revisão
│
├── prisma/schema.txt                  # REMOVER (cópia duplicada), via PR "sem comportamento"
└── .gitignore                         # MUDA · não ignorar prisma/migrations/**/*.sql
```

## Por que cada pasta existe

| Pasta | Problema que resolve | Relação com as outras | Uso no workflow |
|---|---|---|---|
| `.specify/` | Templates e Constitution que os comandos do Spec Kit leem | Fonte da Constitution; `CLAUDE.md` aponta para cá | Toda execução de `/speckit.*` |
| `specs/NNN-*` | Registrar **uma mudança** do pedido até as tarefas | Cita `REQ` de `docs/capabilities`; propõe ADRs | Criada no estágio 3, congelada no merge |
| `docs/capabilities/` | Saber **como o sistema deve se comportar hoje** sem ler 30 specs de mudança | É o alvo da consolidação; testes citam seus `REQ` | Lida no início de toda mudança; atualizada no fim |
| `docs/product/` | Contexto que atravessa capacidades (visão, glossário, NFRs) | Specs de capacidade referenciam, não copiam | Lida no `/speckit.specify` |
| `docs/architecture/adr/` | Memória de decisões com alternativas | Citados por `plan.md` e specs | Estágio 6; checados pelo `trace-check` |
| `docs/discovery/` | Guardar o retrato de um momento, sem confundir com a verdade atual | Origem do baseline | Consultado ao revisitar um módulo |
| `docs/learning/` | O objetivo de aprendizado: tornar visível o raciocínio, não só o resultado | Liga fases do roadmap a conceitos | Uma entrada por fase concluída |
| `scripts/sdd/` | Transformar regras de governança em checagens que falham | Leem specs, ADRs, testes e `sdd.config.json` | CI e hooks |
| `sdd.config.json` | Saber que `services/produto.service.ts` pertence a CAT/PROD | Usado por `impact-map` e pelo hook de lembrete | PRs e sessões do Claude |

## Por que não `docs/specs/<feature>/` (o formato das skills anteriores)?

As skills do portfólio usavam `docs/specs/<feature>/{prd,requirements,design,tasks,status}.md`. Aqui isso duplicaria o `specs/NNN-*/` do Spec Kit. A adaptação proposta:

| Skills anteriores | EcoShop |
|---|---|
| `prd.md` | `docs/product/overview.md` (sistema) + seção "Problema" do `specs/NNN/spec.md` |
| `requirements.md` | `REQ-*` em `docs/capabilities/<cap>/spec.md` (vivos) e no `specs/NNN/spec.md` (delta) |
| `design.md` | `specs/NNN/plan.md` + ADRs |
| `tasks.md` | `specs/NNN/tasks.md` (Spec Kit) |
| `status.md` | `docs/capabilities/<cap>/status.md` (por capacidade, não por feature) |

## Como a estrutura escala

- Mais capacidades: nova pasta em `docs/capabilities/` + linha no `sdd.config.json`; nada mais muda.
- Muitas specs de mudança: `specs/` só cresce, mas ninguém precisa lê-las para entender o presente.
- Se um dia o projeto virar vários serviços, `docs/capabilities/` continua válido (capacidade não é pasta de código).
