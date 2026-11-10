# Constitution do EcoShop

**Versão:** 1.0.0 · **Ratificada:** 2026-11-10 (autorização geral de Arthur; revisar ao fim da Fase 4) · **Última emenda:** —

> Princípios **não negociáveis** do projeto. Instruções de "como trabalhar" ficam em `CLAUDE.md`, `.claude/rules/` e nas skills; decisões com alternativas ficam em `docs/architecture/adr/`; comportamento esperado fica em `docs/capabilities/`.
> Cada artigo traz **Por quê** (evidência no projeto) e **Verificação** (CI, script ou revisão). Vocabulário: **REQ** = requisito com ID; **ADR** = registro de decisão arquitetural.
> Aplicabilidade provisória: os Artigos XIII, XIV.2 e IX são **avisos** (não bloqueiam o CI) até a revisão ao fim da Fase 4.

## Artigo I · A especificação é a fonte de verdade do comportamento

1. Todo comportamento observável pelo usuário ou por um cliente da API é descrito numa spec de capacidade (`docs/capabilities/*/spec.md`) com requisitos identificados (`REQ-<CAP>-NN`).
2. Mudança de comportamento começa pela spec (trilhas em `03-metodologia`, seção 5). Código que diverge da spec é defeito **ou** spec desatualizada; nunca "tanto faz".
3. README e comentários **não são** fonte de verdade de comportamento; devem apontar para a spec.

**Por quê:** o README hoje promete filtro por marca, galeria de fotos, gestão de usuários na UI e chat; nenhum existe como descrito.
**Verificação:** `trace-check` (CI) + revisão do PR.

## Artigo II · Comportamento especificado é comportamento testado

1. Todo requisito com status ✅ tem pelo menos um teste automatizado cujo nome contém o ID (`REQ-CAT-03: …`).
2. Correção de defeito começa por um teste que falha.
3. Testes verificam a spec, não a implementação: um teste gerado a partir do código precisa ser revisado contra o requisito.
4. Pirâmide para este projeto: **unidade** para services, schemas e parsers de IA; **integração** para Route Handlers com Postgres real (container) e Redis opcional; **E2E** só para jornadas críticas (login, catálogo, painel, EcoScan com IA simulada).

**Por quê:** não existe nenhum teste hoje; a única barreira é `tsc`.
**Verificação:** CI (testes + `trace-check` falha se `REQ` ✅ não tem teste).

## Artigo III · Autorização negada por padrão, com uma única fonte de verdade

1. Toda rota de API declara seu nível de acesso (`publico`, `autenticado`, `proprio-recurso`, `admin`); rota sem declaração é tratada como `admin` (negar por padrão).
2. A matriz papel × recurso × ação é parte da spec (`docs/capabilities/autorizacao/spec.md`) e a implementação tem **um** ponto de decisão (qual é o ponto: ADR-P01, pendente).
3. Endpoints que geram custo externo (IA) exigem autenticação e limite de uso.

**Por quê:** D1 (middleware contradiz handler) e D3 (chat público consumindo cota).
**Verificação:** teste de integração que percorre a matriz; revisão do PR para rotas novas.

## Artigo IV · Dado sensível nunca sai do servidor

1. Respostas de API usam projeção explícita (`select`) ou DTO; nunca a entidade Prisma crua de `Usuario`.
2. Hash de senha, tokens e chaves de API não aparecem em respostas, logs nem URLs registradas.

**Por quê:** D2 (`PUT /api/usuarios/[id]` devolve o hash); chave do Gemini em query string.
**Verificação:** teste de contrato que procura `senha` em respostas de usuário; revisão.

## Artigo V · Camadas com responsabilidade única

1. Route Handler: parse, validação de borda, autorização, mapeamento de erro para HTTP. **Não** acessa Prisma.
2. Service: regras de negócio, persistência, cache e invalidação.
3. `lib/ai/providers` e `lib/redis` são adaptadores de infraestrutura; nada de regra de negócio neles.
4. Páginas não implementam regra de negócio nem cálculo de domínio (ex.: impacto ambiental).

**Por quê:** a convenção já existe e funciona em 12 dos 17 handlers; os outros 5 a quebram. Fixar evita que a erosão continue.
**Verificação:** regra de import no ESLint (`no-restricted-imports` de `@/lib/db` em `app/**`), CI.

## Artigo VI · Validação na borda, tipos derivados

1. Toda entrada externa (body, query, params, FormData, resposta de IA) é validada por schema Zod antes de uso. Isso inclui `page`/`size`.
2. Tipos de request/response derivam dos schemas (`z.infer`) ou de um DTO único; tipos paralelos escritos à mão não são permitidos para contratos.

**Por quê:** D9 (query sem validação); `preco: number` vs `Decimal` serializado como string.
**Verificação:** `tsc`; revisão.

## Artigo VII · Erros explícitos e contrato de erro único

1. Services lançam erros de domínio tipados (ex.: `RecursoNaoEncontrado`, `ConflitoDeUnicidade`, `VinculoImpedeExclusao`); handlers os mapeiam numa tabela única para HTTP.
2. Proibido decidir erro por `message.includes(...)`.
3. Toda resposta de erro segue `{ erro, codigo, detalhes? }`, documentado na spec de API.
4. Erro de infraestrutura nunca vira 500 silencioso quando existe comportamento especificado (ex.: FK → 409).

**Por quê:** `includes("P2025")` e `throw new Error("P2025")`; D7.
**Verificação:** testes de integração dos casos de erro de cada `REQ`.

## Artigo VIII · Dependências externas degradam de forma especificada

1. Cada dependência externa (Redis, Azure, Gemini) tem, na spec, o comportamento esperado quando está fora, lenta ou responde lixo.
2. Toda chamada de rede tem timeout e tratamento de exceção no adaptador.
3. Fail-open de segurança (ex.: rate limit liberado sem Redis) só com ADR que aceite o risco.

**Por quê:** a degradação graciosa é um diferencial declarado do projeto, mas o Gemini sem rede derruba o scan (D4) e o rate limit libera tudo sem Redis sem decisão registrada.
**Verificação:** testes com o adaptador simulando falha.

## Artigo IX · Consistência de cache é requisito, não detalhe

1. Cada recurso cacheado declara TTL e quais mutações o invalidam (inclusive mutações de **outras** entidades que ele embute).
2. Cache não pode ser a única cópia de nada.

**Por quê:** produtos embutem nome de marca e categoria, mas mudar a marca não invalida `produtos:*`.
**Verificação:** teste de integração "mutação X → leitura Y reflete" para cada linha da tabela.

## Artigo X · Dados e schema são protegidos

1. Toda mudança de schema é uma migration versionada e revisada; `*.sql` de migrations não pode ser ignorado pelo git.
2. Scripts destrutivos (que apagam dados) não rodam automaticamente em nenhum ambiente compartilhado; seeds são idempotentes.
3. Existe um único `schema.prisma`.

**Por quê:** D5 (seed apaga produtos em todo `compose up`), `.gitignore:70`, `schema.txt` duplicado.
**Verificação:** CI checa `prisma migrate diff` e a ausência de cópias de schema; revisão de scripts.

## Artigo XI · Nenhum dado inventado na interface

1. Número exibido ao usuário como fato (métricas, impacto ambiental, contagens) tem fonte declarada na spec, ou é calculado de dados reais, ou é rotulado como ilustrativo.
2. Conteúdo gerado por IA é identificado como tal na interface.

**Por quê:** "98% satisfação", "2k+ produtos", CO₂ = preço × 0,012.
**Verificação:** revisão humana (não automatizável de forma confiável).

## Artigo XII · Segredos e configuração

1. Nenhum segredo tem valor padrão utilizável fora de desenvolvimento local; a aplicação recusa iniciar em produção sem `JWT_SECRET` forte.
2. Configuração é validada na inicialização por schema único (env schema).
3. Versão de Node é uma só para CI, Docker e desenvolvimento.

**Por quê:** `JWT_SECRET` padrão no Compose; Node 20 vs 22.
**Verificação:** teste de inicialização; CI.

## Artigo XIII · Observabilidade proporcional

1. Erros 5xx e falhas de dependências externas são registrados com contexto (rota, dependência, duração), sem dado sensível.
2. `/api/health` reflete as dependências obrigatórias; dependências opcionais aparecem como "degradado", não como indisponível.

**Por quê:** hoje `/api/health` retorna 503 quando só o Redis (opcional por design) cai, o que pode fazer o Docker marcar o app como unhealthy. Logs são `console.warn` soltos.
**Aplicabilidade:** projeto de portfólio sem SLO; não propor tracing distribuído nem APM.
**Verificação:** revisão; teste do health.

## Artigo XIV · Convenções de código e linguagem

1. Linguagem ubíqua em **português** para domínio (entidades, services, mensagens), como já é hoje; termos técnicos de framework em inglês. O glossário fica em `docs/product/glossario.md`.
2. Um componente/página não passa de ~300 linhas sem justificativa; páginas são compostas de componentes por capacidade.
3. ESLint + Prettier obrigatórios no CI.

**Por quê:** o código já é consistente no idioma; páginas de 900–1.500 linhas impedem testar e especificar por partes.
**Verificação:** lint (CI); limite de tamanho como aviso.

## Artigo XV · Uso de agentes de IA

1. Agentes trabalham a partir de uma spec aprovada e de uma lista de tarefas; não implementam feature sem G1.
2. Agentes não editam a Constitution, ADRs aceitos nem specs de capacidade fora do passo de consolidação; ADR aceito só muda por novo ADR que o substitui.
3. Agentes não marcam requisito como ✅ sem citar o teste que passou.
4. A revisão de spec é feita em contexto isolado (agent `spec-reviewer`), não pelo mesmo contexto que a escreveu.
5. Agentes não executam comandos destrutivos de dados (`migrate reset`, `seed` destrutivo, `docker compose down -v`) sem pedido explícito.
6. Fato desconhecido (ex.: fonte de uma métrica) é marcado como pergunta, nunca preenchido.

**Por quê:** este é um laboratório de engenharia assistida por IA; o risco típico é o agente "resolver" ambiguidade inventando.
**Verificação:** hooks do Claude Code (bloqueios) + revisão.

## Artigo XVI · Consistência código × especificação

1. Todo PR declara: capacidades afetadas, `REQ` tocados, ADRs relacionados, ou "sem mudança de comportamento".
2. PR que muda comportamento atualiza a spec de capacidade no mesmo PR.
3. `trace-check` falha se: um `REQ` citado em teste não existe; um `REQ` ✅ não tem teste; uma spec cita ADR inexistente ou substituído.

**Verificação:** template de PR + CI.

## Definition of Done (critério de aceitação de qualquer mudança)

- [ ] Spec aprovada (G1) e plano/ADR aprovados (G2), conforme a trilha
- [ ] Testes com IDs dos `REQ` afetados, passando
- [ ] `lint`, `typecheck`, `test`, `build`, `trace-check` verdes
- [ ] Spec de capacidade consolidada; status com evidência
- [ ] Sem violação desta Constitution, ou violação justificada no "Complexity Tracking" do `plan.md`

## Governança da Constitution

- Versão semântica no topo (`1.0.0`). MAJOR: remove ou inverte princípio. MINOR: novo princípio. PATCH: redação.
- Emenda só por PR com justificativa e impacto nos artefatos existentes.
- Revisão a cada fase do roadmap: princípio que nunca foi usado para decidir nada é candidato a sair.
