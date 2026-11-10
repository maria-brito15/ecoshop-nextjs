# 06 · Inventário de ADRs: existentes, inferidos e pendentes

## Para que serve um ADR aqui

- **Problema que resolve:** decisões que "todo mundo sabe" e ninguém registrou. No EcoShop, o porquê de JWT sem revogação, fotos em disco ou Redis fail-open está só implícito; um agente que não sabe disso pode "consertar" o que era intencional, ou manter o que era acidental.
- **Relação:** a spec diz *o quê*; o ADR diz *por que este como*; a Constitution diz *o que nenhum ADR pode violar*. O `plan.md` de cada mudança cita os ADRs que segue e propõe novos quando precisa.
- **Regra de ouro:** ADR aceito é imutável. Mudou de ideia? Novo ADR com `Substitui: ADR-NNNN`, e o antigo vira `Substituído por`.

## Formato proposto

```markdown
# ADR-NNNN: <decisão em uma frase>
- Status: Proposto | Aceito | Inferido (histórico) | Substituído por ADR-XXXX | Rejeitado
- Data: AAAA-MM-DD · Decisores: <quem> · Origem: nova | inferida do código
- Capacidades / REQs afetados: …

## Contexto        (forças reais: restrições, requisitos, evidências no código)
## Problema        (a pergunta que a decisão responde)
## Alternativas    (2–3, incluindo "manter como está" quando real) → tabela forças × opções
## Decisão
## Justificativa   (qual trade-off foi aceito)
## Consequências   (positivas, negativas, o que fica bloqueado; arquivos/specs/testes afetados)
## Verificação     (como saberemos que a decisão está sendo seguida)
```

O status **Inferido (histórico)** é a forma honesta de registrar o que o código mostra sem fingir que houve uma decisão formal. Ele diz: "o sistema é assim; não sabemos se foi escolha consciente; as alternativas abaixo são reconstruídas". Um inferido pode ser **ratificado** (vira Aceito por um ADR novo) ou **substituído**.

## 1. ADRs existentes

**[FATO]** Nenhum. A seção "Decisões Técnicas de Destaque" do README é o mais próximo, mas mistura decisão com descrição e não tem alternativas nem consequências negativas.

## 2. ADRs de processo (novos, Fase 1)

| ADR | Decisão | Por que precisa ser ADR |
|---|---|---|
| ADR-0001 | Adotar SDD com spec viva por capacidade + specs de mudança do Spec Kit | É a decisão que organiza todo o resto; alternativas reais: só Spec Kit, OpenSpec |
| ADR-0002 | GitHub Spec Kit versão `<X.Y.Z>` com integração Claude, estrutura gerada registrada | A ferramenta muda rápido; fixar e registrar evita drift de processo |

## 3. ADRs inferidos (históricos) a registrar

| ADR | Decisão inferida | Evidência | Alternativas a reconstruir | Recomendação |
|---|---|---|---|---|
| ADR-0003 | Monólito Next.js App Router, front e API no mesmo deploy | estrutura `app/` + `app/api` | SPA + API separada; Server Components com acesso direto | Ratificar |
| ADR-0004 | UI 100% client-side consumindo a própria API via hooks com cache em memória | todas as páginas `"use client"`; `lib/hooks` | Server Components + `fetch` com cache do Next; React Query/SWR | Registrar como inferido; reavaliar depois (pendente P07) |
| ADR-0005 | Camadas handler → service → Prisma, por pasta técnica | `services/`, `lib/schemas/` | Por domínio (módulos verticais) | Ratificar, com a regra de import da Constitution C-V |
| ADR-0006 | PostgreSQL + Prisma 7 com driver adapter `pg` | `lib/db.ts`, `prisma.config.ts` | Drizzle; Prisma engine nativo | Ratificar |
| ADR-0007 | Sessão stateless: JWT HS256 em cookie httpOnly, 7 dias, sem revogação | `lib/auth/jwt.ts` | sessão em banco/Redis; JWT curto + refresh | Inferido → revisar em P02 |
| ADR-0008 | Autorização em duas camadas (middleware por prefixo + guard por handler) | `middleware.ts`, `_middleware/auth.ts` | uma camada só (qual?) | Inferido → **substituir** via P01 (causa de D1) |
| ADR-0009 | Cache-aside em Redis com invalidação por prefixo via SCAN; cache de 30 s no cliente | `lib/cache`, `useFetch` | sem cache; cache do Next (`revalidateTag`); tags por entidade | Inferido → revisar regras em P05 |
| ADR-0010 | Redis opcional, fail-open (inclusive rate limit) | `lib/redis.ts`, `rate-limit.ts:75` | fail-closed no rate limit | Inferido → decidir explicitamente (P04) |
| ADR-0011 | Fotos de produto no filesystem local (`public/data_fotos`), sem metadados no banco | `foto.service.ts` | tabela `FotoProduto` + volume; storage de objetos (S3/R2) | Inferido → revisar em P03 |
| ADR-0012 | IA em duas etapas (Azure Custom Vision classifica, Gemini explica) com fallback estático | `lib/ai/*` | só LLM multimodal (Gemini com imagem); só classificador + conteúdo curado | Inferido; ver P06 |
| ADR-0013 | Entrega: imagem Docker em ghcr.io + VPS via SSH com Compose; migrations por serviço `migrate` | `ci.yml`, `docker-compose.yml` | PaaS (Vercel + Postgres gerenciado) | Inferido; ratificar se houver produção |
| ADR-0014 | Linguagem do domínio em português no código | todo o código | inglês no código, português na UI | Ratificar (vira C-XIV) |

Sem histórico git, as datas e os autores desses ADRs ficam como "desconhecido". [DÚVIDA] Se existir o repositório com histórico, consigo datar cada um pelo commit que introduziu o padrão.

## 4. ADRs pendentes (decisões que precisam da sua escolha)

Para cada um, apresento as alternativas para avaliação. **Não estou decidindo**; a recomendação é só um ponto de partida para o G2.

### P01 · Onde mora a autorização? (bloqueia a correção de D1 e D3)

| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Só no handler, com política declarativa por rota (`definirRota({ acesso: "proprio-recurso" })`); middleware fica só para redirecionar páginas | Uma fonte de verdade; testável por unidade | Mexer em 17 handlers | Nada relevante |
| B. Só no middleware, matcher gerado de uma tabela | Centralizado | O middleware não sabe o dono do recurso (`proprio-recurso` impossível sem ler o banco no Edge) | Regras por recurso |
| C. Manter duas camadas, mas gerar ambas da mesma tabela | Defesa em profundidade | Complexidade e geração de código | — |

Recomendação inicial: **A**, porque a regra "o próprio usuário" (BR-06) exige conhecer o recurso, o que o Edge não faz bem.

### P02 · Política de sessão

Opções: manter JWT 7d (aceitar risco documentado) · JWT curto (15 min) + refresh token em Redis/banco · sessão em banco. A resposta depende da dúvida "há produção com usuários reais?".

### P03 · Armazenamento de mídia

Opções: manter filesystem + criar tabela `FotoProduto` e servir via rota (resolve o "não serve em produção") · storage de objetos · só `fotoUrl` externo (remover upload). Depende de MIDIA.

### P04 · Comportamento do rate limit sem Redis

Fail-open (atual, disponibilidade) × fail-closed (segurança) × fallback em memória por instância.

### P05 · Estratégia de consistência de cache

Manter prefixos com tabela explícita de invalidação cruzada · cache por tags (`produto:12`, `marca:3`) · reduzir cache a listas de referência e remover de produtos. Precisa de medição antes de decidir (há necessidade real de cache nesse volume?).

### P06 · Escopo e forma da IA

Manter Azure + Gemini · substituir por um modelo multimodal único · manter o chat ou removê-lo. Depende da dúvida 3 e do custo.

### P07 · Busca de dados na UI

Manter hooks próprios · Server Components · biblioteca (TanStack Query). Só faz sentido decidir quando a decomposição das páginas (Fase 6) começar.

### P08 · Estratégia de testes e ferramentas

Vitest (unidade/integração) + Testcontainers ou Postgres do Compose + Playwright (E2E) × Jest. Recomendação inicial: **Vitest + Postgres real em container + Playwright**, porque é a menor pilha que cobre a pirâmide da C-II e o Playwright já está disponível no seu fluxo de trabalho. Este ADR é pré-requisito da Fase 3.

### P09 · Formato do contrato de API

Tabela na spec (Markdown) × OpenAPI gerado de Zod × OpenAPI escrito à mão. Recomendação inicial: tabela na spec agora; OpenAPI só se surgir um consumidor externo.

### P10 · Lint e formatação

ESLint flat config (`eslint-config-next`) + Prettier, migrando de `next lint` (depreciado). Quase sem alternativa real, mas é ADR porque destrava o CI (D10).
