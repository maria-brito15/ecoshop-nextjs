# 08 · Claude Code no ambiente de engenharia: Skills, Rules, Agents e Hooks

## 1. Os mecanismos e quando usar cada um

| Mecanismo | O que é | Quando carrega | Natureza | Use para | Não use para |
|---|---|---|---|---|---|
| `CLAUDE.md` | Contexto do projeto | **Sempre**, em toda sessão | Instrução (o modelo pode ignorar) | O mínimo que toda tarefa precisa: o que é o projeto, comandos, onde está cada fonte de verdade | Regras longas, procedimentos, regras de um só diretório |
| `.claude/rules/*.md` | Regras com escopo por caminho (`paths:` no frontmatter) | Quando a sessão trabalha em arquivos que casam | Instrução | Convenções de um tipo de arquivo ("em `app/api/**`, não importe Prisma") | Procedimentos de várias etapas |
| Skill (`.claude/skills/<n>/SKILL.md`) | Procedimento com conhecimento sob demanda (`references/`, `scripts/`) | Quando o pedido casa com a `description`, ou por `/nome` | Instrução + ferramentas | "Como fazer X bem": escrever requisitos, um ADR, uma estratégia de teste | Regras que valem sempre; checagens que precisam ser garantidas |
| Agent (`.claude/agents/<n>.md`) | Subagente com **contexto próprio**, prompt e ferramentas restritas | Quando delegado | Execução isolada | Independência (revisar sem herdar o viés de quem escreveu) e tarefas longas cujo detalhe não deve poluir a sessão | Coisas que a sessão principal faria igual |
| Hook (`.claude/settings.json`) | Comando que o **harness** executa em eventos (antes/depois de ferramenta, ao parar, ao iniciar) | Sempre, deterministicamente | **Garantia** | Bloquear ação perigosa, rodar validador, injetar lembrete objetivo | Julgamento ("a spec está boa?") |
| Script (`scripts/sdd/*.mjs`) | Validador determinístico | Chamado por hook, CI, skill ou você | Garantia | Contagens, formatos, ligações REQ↔teste | — |

**Regra contra duplicação:** cada instrução tem um único lar, nesta ordem de preferência: (1) se dá para verificar por script → script + CI/hook; (2) se é princípio inegociável → Constitution; (3) se vale para um tipo de arquivo → rule; (4) se é um procedimento → skill; (5) se é contexto global mínimo → `CLAUDE.md`. Os outros lugares **apontam**, não repetem. Exemplo: "handler não importa Prisma" mora na Constitution (C-V), é verificado pelo ESLint; a rule `api-routes.md` só diz "siga C-V; o lint vai falhar se não".

## 2. `CLAUDE.md` proposto (esqueleto, ~40 linhas)

```markdown
# EcoShop · instruções para o Claude Code
Next.js 15 + Prisma/Postgres + Redis + IA (Azure, Gemini). Domínio em português.

## Fontes de verdade (leia, não presuma)
- Princípios: .specify/memory/constitution.md
- Comportamento esperado: docs/capabilities/<cap>/spec.md (+ status.md)
- Decisões: docs/architecture/adr/ (só "Aceito" vale; "Inferido" é descrição, não regra)
- Mudança em andamento: specs/NNN-*/ do branch atual

## Fluxo
Mudança de comportamento → skill spec-driven-development (escolha a trilha).
Não implemente sem spec aprovada. Não marque REQ ✅ sem teste que passou.

## Comandos
npm run dev | lint | typecheck | test | test:integration | build
node scripts/sdd/trace-check.mjs   node scripts/sdd/spec-lint.mjs

## Nunca
- editar constitution.md ou ADR aceito (proponha novo ADR)
- rodar seed/migrate reset/compose down -v sem pedido explícito
```

## 3. Skills

### 3.1 As quatro skills existentes, especializadas

As versões atuais (em `skills-engenharia.zip`) são genéricas e trazem detalhes do portfólio (`src/data/routes.js`, Vitest de front, prefixos ES/SH). Especializar significa trocar os exemplos e as "forças" pelos do EcoShop e alinhar a estrutura de pastas ao Spec Kit.

| Skill | Responsabilidade | O que muda para o EcoShop | `references/` |
|---|---|---|---|
| `requirements-engineering` | Transformar pedido em requisitos EARS testáveis, com ID, critério e perguntas | IDs `REQ-<CAP>-NN`, `BR-NN`, `NFR-<tema>-NN`; lista de capacidades do `sdd.config.json`; incluir glossário e modelo de domínio (substitui uma skill de DDD separada); exemplos com casos do EcoShop (perfil, EcoScan) | `ears-pt.md`, `qualidade-de-requisito.md` (checklist testável/não ambíguo/necessário), `linguagem-ubiqua.md` |
| `software-architecture` | Comparar opções e registrar ADR | Forças reais do projeto: Edge vs Node no middleware, custo de IA, Redis opcional, VPS único, um mantenedor; status **Inferido**; regra "substitui, não edita" | `forcas-ecoshop.md`, `adr-template.md`, `como-inferir-adr.md` |
| `spec-driven-development` | Orquestrar o fluxo: escolher a trilha, chamar os comandos do Spec Kit na ordem, fazer a consolidação | Remove a pasta `docs/specs/<feature>`; passa a usar `specs/NNN` + `docs/capabilities`; adiciona o passo de consolidação (G4) e as trilhas | `trilhas.md`, `consolidacao.md`, `mapa-speckit.md` (comando ↔ estágio ↔ gate) |
| `technical-writing` | Documentação clara e verificável | Política "README enxuto aponta para docs"; termos do glossário; checar comandos e caminhos | `templates.md` (README, guia, changelog) |

### 3.2 Skills novas (só as que têm responsabilidade própria)

| Skill | Problema real que resolve | Escopo | Fora do escopo |
|---|---|---|---|
| `test-strategy` | Não existe nenhum teste; sem um padrão, cada teste gerado por agente seguirá uma convenção diferente e confirmará o código em vez da spec | Escolher o nível (unidade/integração/E2E) por requisito; nomear com `REQ-*`; fixtures de banco; dublês para Azure/Gemini/Redis (inclusive falha); teste de caracterização no baseline | Escolher a ferramenta (é o ADR P08) |
| `brownfield-discovery` | O baseline exige fazer reverse engineering de 12 capacidades com o mesmo rigor deste diagnóstico | Ler o código de uma capacidade → listar fatos com `arquivo:linha`, inferências, divergências com a doc, débitos → propor `REQ` retroativos com status → perguntas abertas. Cobre "technical debt analysis" | Corrigir o que encontrar |

### 3.3 Áreas avaliadas que **não** viram skill

| Área | Por que não | Onde fica |
|---|---|---|
| Domain-Driven Design | 6 entidades e um domínio simples; DDD tático seria abstração sem problema. O valor real (linguagem ubíqua, invariantes) cabe na `requirements-engineering` | `docs/product/glossario.md` e `modelo-de-dominio.md` |
| Database design | Poucas decisões, e todas cabem em ADR + rule | rule `prisma.md` + skill `software-architecture` |
| API design | São convenções por arquivo, não procedimento | rule `api-routes.md` + Constitution C-III, C-VI, C-VII |
| Security engineering | O Claude Code já tem `/security-review`; o que é específico do projeto são regras | Constitution C-III, C-IV, C-XII + rule `api-routes.md` |
| Code review | Já existe `/code-review`; o que falta é revisar **conformidade com a spec**, que é papel de agent | agent `verifier` |
| Specification validation | Parte é formato (script) e parte é julgamento independente (agent) | `spec-lint.mjs` + agent `spec-reviewer` |
| Documentation review | É o mesmo trabalho do drift | agent `drift-auditor` + checks da `technical-writing` |

Resultado: **6 skills** (4 adaptadas + 2 novas). Revisar na Fase 7: skill que não foi acionada em nenhuma mudança real sai.

## 4. Rules por caminho (`.claude/rules/`)

| Arquivo | `paths` | Conteúdo (curto, apontando para a fonte) |
|---|---|---|
| `api-routes.md` | `app/api/**` | Declarar nível de acesso; validar com Zod; usar o mapa de erros; nunca devolver entidade `Usuario` crua; citar `REQ` no teste |
| `services.md` | `services/**` | Lançar erros de domínio; atualizar a tabela de invalidação de cache da spec ao mudar o que se embute; `select` explícito |
| `prisma.md` | `prisma/**` | Migration nova sempre versionada; seed idempotente e não destrutivo; ADR para mudança de modelo |
| `ai-integration.md` | `lib/ai/**`, `app/api/ia/**` | Timeout e try/catch no adaptador; fallback conforme spec SCAN; chave nunca em log; considerar custo |
| `ui.md` | `app/**/*.tsx` | Sem regra de negócio nem métrica inventada (C-XI); componentizar por capacidade |
| `tests.md` | `**/*.test.ts`, `tests/**` | Nome com `REQ-*`; testar contra a spec; dublês de IA em `tests/fixtures` |
| `sdd-docs.md` | `docs/**`, `specs/**`, `.specify/**` | ADR aceito é imutável; status exige evidência; rodar `spec-lint` |

## 5. Agents (`.claude/agents/`)

| Agent | Por que precisa ser agent (e não skill) | Entrada | Ferramentas | Saída |
|---|---|---|---|---|
| `spec-reviewer` | **Isolamento**: revisar a spec sem o contexto da conversa que a escreveu (o "Goldfish" do relatório, cap. 8). Uma skill rodaria no mesmo contexto e herdaria o viés | Caminho da spec + Constitution + glossário. **Não** recebe o código nem a conversa | `Read`, `Grep` restritos a `docs/`, `specs/`, `.specify/memory/` | Achados com severidade (bloqueante/importante/sugestão): ambiguidade, requisito não testável, caso-limite ausente, conflito entre REQs |
| `verifier` | Tarefa longa (rodar testes, ler diff) que poluiria a sessão; olhar independente do implementador | `specs/NNN` + diff do branch | `Read`, `Grep`, `Bash` (apenas `npm run test*`, `trace-check`) | Tabela REQ → teste → passou? → divergências |
| `drift-auditor` | Leitura ampla de specs × código; resultado é um relatório, não edição | Uma capacidade (ou todas) | `Read`, `Grep`, `Glob` (sem escrita) | Relatório de drift: REQ que o código não cumpre, comportamento sem REQ, ADR contrariado, doc desatualizada |

Os três são **somente leitura**. Quem altera arquivos é a sessão principal, com você vendo.

## 6. Hooks (`.claude/settings.json`)

| Evento | Matcher | Ação | Por quê | Bloqueia? |
|---|---|---|---|---|
| `PreToolUse` | `Edit\|Write` em `.specify/memory/constitution.md` ou ADR com `Status: Aceito` | pede confirmação (`ask`) | C-XV.2: agente não edita decisão aprovada por conta própria | Sim (pergunta) |
| `PreToolUse` | `Bash` com `prisma migrate reset`, `db push --force-reset`, `compose down -v`, `seed` | pede confirmação | C-X, C-XV.5; D5 mostra que o risco é real | Sim (pergunta) |
| `PostToolUse` | `Edit\|Write` em código mapeado no `sdd.config.json` | `impact-map` injeta lembrete: "este arquivo pertence a CAT; REQs relacionados: …; há `specs/NNN` ativa?" | Torna o vínculo código→spec visível no momento da edição | Não |
| `Stop` | — | roda `trace-check --changed` e `spec-lint` nos arquivos tocados; se falhar, devolve o resultado | Feedback antes de você revisar | Não bloqueia em loop (só informa) |
| `SessionStart` | — | mostra o branch, a `specs/NNN` ativa e o próximo item não marcado do `tasks.md` | Retomar o trabalho sem reexplicar | Não |

Os hooks nunca substituem o CI: hook é conveniência local; o **CI é o único gate coercitivo** (relatório, cap. 12.2).

## 7. Scripts de validação (`scripts/sdd/`)

| Script | Verifica | Usado por |
|---|---|---|
| `spec-lint.mjs` | Toda spec de capacidade tem as seções obrigatórias; IDs no formato e únicos; nenhum ID reutilizado; EARS com gatilho e resposta; links para ADR existentes | hook Stop, CI |
| `trace-check.mjs` | REQ citado em teste existe; REQ ✅ tem teste; status ✅ cita teste existente; spec de mudança aponta para capacidades existentes; tarefa tem REQ | hook Stop, CI |
| `adr-index.mjs` | Gera o índice de ADRs; valida status e cadeia "substitui/substituído por" | CI |
| `impact-map.mjs` | Dado um diff, lista capacidades e ADRs potencialmente afetados | hook PostToolUse, CI (comentário no resumo do job) |

Node puro, sem dependências novas, no mesmo estilo dos scripts que já funcionaram no portfólio (`gap-summary.mjs`, `sweep.mjs`).
