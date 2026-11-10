# 02 · Arquitetura atual (reverse engineering)

> Descreve **o que o código faz hoje**, não o que o README diz. Divergências estão marcadas.

## 1. Estilo arquitetural

**[FATO]** Monólito modular de um único deployable (Next.js), com front-end SPA-like (todas as páginas são Client Components) consumindo a própria API REST via `fetch`. Não há Server Components buscando dados, Server Actions nem SSR de dados: o servidor só renderiza a casca e responde à API.

**[INFERÊNCIA]** É uma arquitetura em camadas "por pasta técnica" (`services/`, `lib/schemas/`, `types/`), não por domínio. Para o tamanho atual (6 entidades) é adequada; a dor aparece na UI (páginas monolíticas), não no back-end.

## 2. Visão de componentes (C4 nível 2, simplificado)

```mermaid
flowchart LR
  subgraph Browser
    P[Páginas client<br/>app/(grupo)/*/page.tsx]
    H[Hooks de dados<br/>lib/hooks: useFetch / useMutation<br/>cache Map 30s]
    P --> H
  end
  subgraph "Next.js (Node)"
    MW[Edge middleware<br/>middleware.ts + config/rotas-protegidas.ts]
    RH[Route Handlers<br/>app/api/**/route.ts]
    AZ[Guards<br/>app/_middleware/auth.ts]
    ZS[Schemas Zod<br/>lib/schemas]
    SV[Services<br/>services/*.service.ts]
    CA[Cache<br/>lib/cache -> lib/redis]
    AI[IA<br/>lib/ai: providers, prompt, parser, fallback]
    FS[(public/data_fotos<br/>filesystem)]
  end
  DB[(PostgreSQL)]
  RD[(Redis)]
  AZV[Azure Custom Vision]
  GEM[Google Gemini]

  H -->|fetch /api| MW --> RH
  RH --> AZ
  RH --> ZS
  RH --> SV
  RH -.->|direto, sem service| DB
  SV --> CA --> RD
  SV --> DB
  SV --> FS
  RH --> AI --> AZV
  AI --> GEM
```

## 3. Responsabilidades e dependências entre módulos

| Módulo | Responsabilidade real | Depende de | Observação |
|---|---|---|---|
| `middleware.ts` + `config/rotas-protegidas.ts` | Barrar por prefixo: `/perfil` (autenticado), `/painel`, `/api/usuarios`, `/api/admin` (admin) | `lib/auth` | `/api/admin` **não existe**. `/ia-scan` e `/api/ia/*` **não estão** no matcher |
| `app/_middleware/auth.ts` | `requireAuth`, `requireAdmin` dentro dos handlers | `lib/auth`, `lib/http` | É a autorização que de fato vale para produtos, categorias, marcas, certificados, fotos e scan |
| `app/api/**` | Parse, validação, autorização, mapeamento de erro → HTTP | schemas, services, às vezes `prisma` direto | Mapeamento de erro por string |
| `services/*` | CRUD + cache + invalidação | `lib/db`, `lib/cache`, `fs` | Não há regras de negócio além de unicidade de e-mail e hash de senha |
| `lib/cache` | `comCache`, invalidação por prefixo | `lib/redis` | Abstração (`CacheProvider`) com uma única implementação |
| `lib/redis` | Cliente singleton + helpers que engolem erro | `redis` | Também usado direto por `rate-limit` e `health` |
| `lib/ai` | Pipeline Azure → Gemini → parser → fallback | `fetch` | Bem decomposto (provider/prompt/parser/fallback) |
| `lib/hooks` | Data fetching no cliente com cache em memória | `fetch` | O cache de 30 s é por aba, invalidado por substring de URL |
| `types/*` | Contratos TS escritos à mão | — | Sem ligação com Zod/Prisma |

**[FATO]** Não há ciclo de dependência relevante. Mas a regra "handler não fala com Prisma" **não é respeitada** em `api/auth`, `api/auth/me`, `api/auth/refresh`, `api/users`, `api/health`.

## 4. Autorização: o ponto arquitetural mais frágil

Hoje há duas fontes de verdade para "quem pode o quê":

| Recurso | Middleware diz | Handler diz | README diz | Resultado efetivo |
|---|---|---|---|---|
| `GET/PUT /api/usuarios/[id]` | só ADMIN | ADMIN **ou o próprio** | Admin | só ADMIN (perfil quebra) |
| `GET/POST /api/usuarios` | só ADMIN | só ADMIN | Admin | só ADMIN |
| `POST/PUT/DELETE produtos, categorias, marcas, certificados` | (não cobre) | ADMIN | Admin | ADMIN |
| `POST/DELETE /api/produtos/[id]/fotos` | (não cobre) | ADMIN | "✅ autenticado", matcher citado no README | ADMIN |
| `GET /api/produtos/[id]/fotos` | (não cobre) | público | ✅ | público |
| `POST /api/ia/scan` | (não cobre) | autenticado | ✅ | autenticado |
| `POST /api/ia/chat` | (não cobre) | **nenhum** | ✅ | **público** |
| página `/ia-scan` | (não cobre) | — | "(autenticado)" | pública; a chamada falha com 401 |

[RECOMENDAÇÃO] Esta tabela é exatamente o tipo de artefato que deve virar **spec** (matriz papel × recurso × ação) e cuja implementação deve ter **uma** fonte de verdade decidida por ADR.

## 5. Dados e persistência

```mermaid
erDiagram
  USUARIO ||--o| MARCA : "possui (1:1)"
  MARCA ||--o{ PRODUTO : fabrica
  CATEGORIA ||--o{ PRODUTO : classifica
  PRODUTO ||--o{ PRODUTO_CERTIFICADO : tem
  CERTIFICADO ||--o{ PRODUTO_CERTIFICADO : certifica
  USUARIO { int id PK; string email UK; string senha; enum tipo; datetime criadoEm }
  MARCA { int id PK; string nome UK; int usuarioId UK,FK }
  PRODUTO { int id PK; string nome; decimal preco; string fotoUrl; int categoriaId FK; int marcaId FK }
  CERTIFICADO { int id PK; string nome UK; string orgaoEmissor }
```

Fora do banco: fotos (`public/data_fotos/{produtoId}_*`), histórico de vistos (`localStorage`, nunca escrito), preferência de tema (`localStorage`).

**[FATO]** Invariantes que existem só por constraint de banco: e-mail único, nomes únicos de categoria/marca/certificado, uma marca por usuário. Invariantes que **não existem** em lugar nenhum: "dono de Marca deve ter tipo MARCA" (o admin pode criar marca para um CLIENTE), "preço positivo" no banco (só no Zod).

## 6. Fluxos de execução

### Leitura de catálogo
`useListarProdutos` → Map do cliente (30 s, stale-while-revalidate) → `GET /api/produtos?…` → `comCache("produtos:<query>", 120 s)` → Prisma `findMany` + `count`.

### Mutação (admin)
`useMutation` → `POST /api/produtos` → `requireAdmin` → Zod → `criarProduto` → Prisma → `invalidarCache("PRODUTOS")` (SCAN+DEL) → cliente invalida entradas cuja URL contém `/api/produtos`.

### Login
`POST /api/auth` → rate limit por IP (10/min) → Zod → `bcrypt.compare` → JWT `{id,email,tipo}` 7d → cookie `token` httpOnly, `SameSite=Lax` (README diz Strict).

### EcoScan
`POST /api/ia/scan` (FormData `image`) → `requireAuth` → valida MIME/tamanho → Azure → melhor predição ≥ `AI_CONFIDENCE_THRESHOLD` e ≠ `outros` → prompt → Gemini → parser (6 campos) → fallback `analiseBasica` se texto vazio ou inválido → 200, ou 422 se não identificou.

## 7. Atributos de qualidade observados

| Atributo | Situação | Evidência |
|---|---|---|
| Disponibilidade com Redis fora | Boa (leitura vai ao banco; rate limit libera) | `lib/redis.ts`, `rate-limit.ts:75-80` |
| Disponibilidade com IA fora | Parcial (Azure ok; Gemini com erro de rede → 500) | `gemini-chat.ts:73` |
| Consistência de cache | Eventual, com buracos de invalidação entre entidades | `services/*` |
| Segurança | Base razoável (httpOnly, bcrypt 12, Zod), com falhas pontuais D1–D3 | seção 10 do diagnóstico |
| Testabilidade | Baixa: sem testes; páginas grandes; `prisma` como Proxy global | — |
| Observabilidade | `console.warn` em Redis; `/api/health` (DB + Redis). Sem logs estruturados, sem correlação | `api/health/route.ts` |
| Operabilidade | Docker bem montado, mas seed destrutivo e credenciais inconsistentes | `docker-compose.yml` |

## 8. Decisões arquiteturais implícitas encontradas no código

Viram ADRs "inferidos" no inventário (`06-inventario-adrs.md`):

1. Monólito Next.js App Router, UI 100% client-side consumindo a própria API.
2. Camadas handler → service → Prisma, organizadas por pasta técnica.
3. PostgreSQL + Prisma 7 com driver adapter `pg`.
4. Autenticação stateless JWT em cookie httpOnly, 7 dias, sem revogação.
5. Autorização em duas camadas (middleware por prefixo + guard no handler).
6. Cache-aside em Redis com invalidação por prefixo + cache em memória no cliente.
7. Redis como dependência opcional (fail-open, inclusive no rate limit).
8. Fotos de produto no filesystem local, sem metadados no banco.
9. IA em duas etapas: classificação (Azure Custom Vision) + geração (Gemini), com fallback estático.
10. Deploy: imagem Docker em ghcr.io, VPS via SSH com Compose.
11. Idioma do domínio em português no código (entidades, funções, mensagens).
