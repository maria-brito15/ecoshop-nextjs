# 🌿 EcoShop

> Plataforma de e-commerce sustentável com scanner de materiais por IA, desenvolvida como projeto full-stack de portfólio com Next.js 15, TypeScript, PostgreSQL, Redis, Docker e integração com Azure Custom Vision + Google Gemini 2.0 Flash.

[![CI/CD](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)

## 🇺🇸 [English Version](./README-en.md)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Decisões Técnicas de Destaque](#-decisões-técnicas-de-destaque)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Segurança](#-autenticação-e-segurança)
- [Cache em Duas Camadas](#-cache-em-duas-camadas)
- [Integração com IA](#-integração-com-ia)
- [Rotas da API](#-rotas-da-api)
- [Docker e Infraestrutura](#-docker-e-infraestrutura)
- [CI/CD](#️-cicd)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas](#-estrutura-de-pastas)

---

## 🌱 Sobre o Projeto

O **EcoShop** é um e-commerce full-stack voltado para produtos sustentáveis, construído como projeto de portfólio com foco em boas práticas reais de engenharia de software.

A proposta vai além de um CRUD convencional: a plataforma oferece um **scanner inteligente de materiais recicláveis via câmera** (Azure Custom Vision + Gemini), um **painel administrativo completo** para gestão de produtos, marcas, categorias, certificados e usuários, além de um **chat de IA** sobre sustentabilidade.

Tecnicamente, o projeto aplica padrões usados em produção:

- Arquitetura em camadas com separação clara de responsabilidades (Route Groups, Services, Hooks, Schemas, Types)
- Autenticação stateless com JWT via Edge Middleware, sem dependência de sessão no servidor
- Cache em duas camadas (Redis no servidor + `Map` em memória no cliente com stale-while-revalidate)
- Invalidação seletiva de cache por padrão de chave (`SCAN` + `DEL` sem bloquear o Redis)
- Degradação graciosa de serviços externos: Redis e IA offline não derrubam a aplicação
- Containerização completa com Docker multi-stage e orquestração via Compose
- Pipeline de CI/CD com GitHub Actions: lint, type-check, build, push para ghcr.io e deploy por SSH

---

## 🔬 Decisões Técnicas de Destaque

Esta seção documenta as escolhas de arquitetura mais relevantes para quem avalia o projeto.

### Cache em duas camadas com stale-while-revalidate

A aplicação implementa cache em dois níveis independentes:

**Servidor (Redis):** cada rota GET armazena a resposta no Redis com TTL calibrado por tipo de recurso (1–5 min). Mutações invalidam imediatamente as chaves afetadas usando `scanIterator` (non-blocking) + `DEL` em lote. A função `comCache(chave, ttl, fetcher)` encapsula esse padrão, mantendo as Route Handlers limpas.

**Cliente (in-memory Map):** o hook `useFetch` mantém um `Map` com TTL de 30 segundos e implementa stale-while-revalidate: retorna o cache instantaneamente (sem tela de loading), dispara um fetch em background e atualiza o estado React apenas se os dados mudaram. O hook `useMutation` sincroniza a invalidação do cache do cliente com as mutações no servidor.

```
useFetch (cliente)
  → Map hit? → retorna imediatamente + revalida em background
  → Map miss → fetch(url)
      → Route Handler → comCache(chave, ttl, fetcher)
          → Redis hit? → retorna JSON
          → Redis miss → Prisma → redisSet() → retorna
```

### Edge Middleware para autenticação e autorização

O `middleware.ts` roda no **Edge Runtime** do Next.js e é responsável por toda a camada de autenticação e controle de acesso antes que qualquer Route Handler seja executado. Isso evita que lógica de segurança fique distribuída entre páginas e APIs.

As regras de proteção ficam centralizadas em `config/rotas-protegidas.ts`, desacopladas do middleware em si. Há três níveis:

1. **Público** — sem restrição
2. **Autenticado** — exige token JWT válido no cookie
3. **Admin** — exige `tipo === "ADMIN"` no payload do token

Páginas não autenticadas recebem redirect para `/sign-in?next=<rota_original>`. APIs retornam `401` ou `403` em JSON sem vazar detalhes internos.

### Validação de schema com Zod nas bordas

Todos os endpoints validam o corpo da requisição com schemas Zod definidos em `lib/schemas/`. A validação acontece **antes** de qualquer operação no banco. Erros de validação retornam `400` com a lista de campos inválidos. Isso elimina uma classe inteira de bugs por dados malformados e documenta implicitamente o contrato de cada endpoint.

### Singleton do Prisma Client resistente a hot-reload

Em desenvolvimento, o Next.js reinicia os módulos a cada alteração de arquivo. Sem cuidado, cada hot-reload abriria uma nova connection pool com o banco, esgotando as conexões. O cliente Prisma é instanciado como singleton em `globalThis`, sobrevivendo aos reloads. O mesmo padrão é aplicado ao cliente Redis.

### Degradação graciosa de serviços externos

Redis e IA são serviços opcionais na arquitetura:

- **Redis offline**: `redisGet` retorna `null` e `redisSet` é silenciado. A aplicação busca direto no banco sem afetar o usuário.
- **Azure Vision offline**: o scanner retorna erro amigável sem quebrar outras funcionalidades.
- **Gemini offline ou JSON inválido**: `obterAnaliseSustentabilidade()` retorna um fallback pré-definido (`lib/ai/fallbacks/sustentabilidade.ts`) em vez de propagar a exceção.

### Dockerfile multi-stage otimizado

```
deps     → instala node_modules (cache de layer Docker)
builder  → gera Prisma Client + build do Next.js
runner   → copia apenas os artefatos necessários, roda como usuário não-root
```

A imagem final não carrega devDependencies nem código-fonte, reduzindo o tamanho significativamente.

---

## ✨ Funcionalidades

### Para Usuários

- 🛒 **Catálogo de Produtos** — listagem com filtros por categoria e marca, paginação e busca
- 🔍 **Página de Produto** — detalhes completos, galeria de fotos, certificados de sustentabilidade e marca responsável
- 📸 **IA Scan** — scanner via câmera que identifica o material de um objeto e retorna análise ambiental completa: tempo de decomposição, onde e como descartar, dicas sustentáveis e benefícios da reciclagem
- 🎓 **Seção Educação** — conteúdo curado sobre consumo consciente e reciclagem
- 👤 **Perfil de Usuário** — gerenciamento de dados pessoais com controle de acesso por role
- 💬 **Chat de Sustentabilidade** — assistente de IA para dúvidas sobre práticas sustentáveis

### Para Administradores

- 📊 **Painel Admin** — dashboard completo com gestão de produtos, categorias, marcas, certificados e usuários
- 🖼️ **Upload de Fotos** — gerenciamento de imagens de produtos diretamente pela interface
- 👥 **Gestão de Usuários** — listagem, edição e controle de roles (ADMIN, CLIENTE, MARCA)

---

## 🛠 Stack Tecnológica

| Camada                       | Tecnologia                             |
| ---------------------------- | -------------------------------------- |
| **Framework**                | Next.js 15 (App Router)                |
| **Linguagem**                | TypeScript 5                           |
| **Estilização**              | Tailwind CSS 4                         |
| **Banco de Dados**           | PostgreSQL 16                          |
| **ORM**                      | Prisma 7 (`@prisma/adapter-pg`)        |
| **Cache**                    | Redis 7 (`redis` v4)                   |
| **Autenticação**             | JWT via `jose` + `bcryptjs`            |
| **Validação**                | Zod 3                                  |
| **IA — Visão Computacional** | Azure Custom Vision                    |
| **IA — Análise Ambiental**   | Google Gemini 2.0 Flash                |
| **Containerização**          | Docker + Docker Compose                |
| **CI/CD**                    | GitHub Actions + ghcr.io               |
| **Runtime**                  | Node.js 20 + Edge Runtime (Middleware) |

---

## 🏗 Arquitetura

O projeto utiliza o **App Router do Next.js 15** com Route Groups para isolar os contextos de cada área da aplicação:

```
app/
├── (admin)/painel/        → Área administrativa (role: ADMIN)
├── (auth)/sign-in/        → Autenticação
├── (educacao)/educacao/   → Conteúdo educacional
├── (ia-scan)/ia-scan/     → Scanner de materiais (autenticado)
├── (perfil)/perfil/       → Perfil do usuário (autenticado)
├── (sobre)/about/         → Sobre a plataforma
├── (store)/produtos/      → Catálogo e página de produto
│   └── [id]/              → Rota dinâmica por produto
├── api/                   → API Routes (REST)
│   ├── auth/              → Login, logout, me, refresh
│   ├── categorias/        → CRUD de categorias
│   ├── certificados/      → CRUD de certificados
│   ├── ia/                → scan e chat
│   ├── marcas/            → CRUD de marcas
│   ├── produtos/          → CRUD + fotos
│   ├── users/             → Cadastro público
│   └── usuarios/          → Gestão admin
└── page.tsx               → Home com scroll reveal e categorias dinâmicas
```

**Camadas além do app:**

```
lib/
├── ai/                    → Integração Azure Custom Vision + Gemini
│   └── fallbacks/         → Respostas de fallback para IA offline
├── hooks/                 → Hooks de dados (useFetch, useMutation, useAuth, ...)
├── http/                  → Helpers de resposta HTTP padronizados
├── schemas/               → Schemas Zod por entidade
├── rate-limit.ts          → Rate limiting via Redis
└── redis.ts               → Cliente singleton + helpers (get/set/del/delPattern)

services/                  → Regras de negócio e acesso ao banco (Prisma)
types/                     → Tipos TypeScript do domínio e da API
config/                    → Configuração de rotas protegidas
```

### Fluxo de Autenticação

```
POST /api/auth
  → bcrypt.compare(senha, hash)
  → signJWT({ id, tipo }, JWT_SECRET)
  → Cookie HttpOnly (7 dias, SameSite=Strict)

Requisições subsequentes:
  → Edge Middleware → verifyToken(cookie) → payload
  → Rota protegida? → verifica tipo → passa ou bloqueia
```

---

## 🗃 Banco de Dados

Schema modelado com Prisma 7 e PostgreSQL, refletindo o domínio de e-commerce sustentável:

```prisma
Usuario        → tipo: ADMIN | CLIENTE | MARCA (enum no banco)
Marca          → 1:1 com Usuario (tipo MARCA)
Categoria      → 1:N com Produto
Certificado    → N:N com Produto (via ProdutoCertificado — tabela de junção explícita)
Produto        → pertence a Marca e Categoria, possui múltiplas fotos e certificados
```

**Destaques do modelo:**

- Enum `TipoUsuario` no PostgreSQL para controle de roles com type safety end-to-end (banco → Prisma → TypeScript)
- Relação N:N explícita com tabela de junção `produto_certificado` — mais flexível que implicit many-to-many do Prisma para adicionar campos futuros
- Seed completo com dados de desenvolvimento (`prisma/seed.ts`) e seed separado para o administrador inicial (`prisma/seed-admin.ts`), configurável por variáveis de ambiente
- Migration versionada em `prisma/migrations/` com `migration_lock.toml` para consistência de banco entre ambientes

---

## 🔐 Autenticação e Segurança

- **JWT stateless** com expiração de 7 dias, assinado com HS256 via `jose` (compatível com Edge Runtime)
- **Senhas criptografadas** com `bcryptjs` (hash + salt rounds padrão)
- **Middleware centralizado** no Edge Runtime: roda antes de qualquer handler, sem overhead de Node.js
- Regras de acesso desacopladas em `config/rotas-protegidas.ts` — adicionar uma nova rota protegida não exige tocar no middleware
- **Rate limiting** em endpoints sensíveis (login, registro) via Redis com janela deslizante
- APIs retornam `401 Unauthorized` (não autenticado) ou `403 Forbidden` (sem permissão) sem vazar stack traces
- Redirect pós-login via `?next=<rota>` preserva a intenção de navegação do usuário

```ts
// Rotas cobertas pelo matcher do middleware
matcher: [
  "/painel/:path*",
  "/perfil/:path*",
  "/api/admin/:path*",
  "/api/usuarios/:path*",
  "/api/produtos/:path*/fotos",
];
```

---

## ⚡ Cache em Duas Camadas

### Servidor — Redis

Todas as rotas GET passam por `comCache(chave, ttl, fetcher)`, que verifica o Redis antes de consultar o banco:

| Recurso                          | TTL   |
| -------------------------------- | ----- |
| Categorias, marcas, certificados | 5 min |
| Produtos (listagem paginada)     | 2 min |
| Produto, categoria, marca por id | 3 min |
| Dados de usuário e sessão        | 1 min |
| Fotos do produto                 | 2 min |

Mutações (POST, PUT, DELETE) invalidam o cache imediatamente após gravar no banco. Para padrões de chave (ex: `produtos:*`), a invalidação usa `scanIterator` + `DEL` em lote — não bloqueia o Redis com `KEYS *`.

O cliente Redis é singleton em `globalThis` para sobreviver a hot-reloads do Next.js. Falhas de conexão são silenciadas com `console.warn` — o banco assume as leituras sem impacto ao usuário.

### Cliente — Map em memória

O hook `useFetch` implementa stale-while-revalidate:

1. Retorna o cache local instantaneamente (zero tela de loading para dados em cache)
2. Dispara revalidação em background após TTL de 30 segundos
3. Atualiza o estado React com `JSON.stringify` diff para evitar re-renders desnecessários

O hook `useMutation` invalida as entradas do Map local após cada mutação, em sincronia com a invalidação no Redis pelo servidor.

---

## 🤖 Integração com IA

### Pipeline do Scanner (`/ia-scan`)

```
Foto do usuário (base64 ou File)
       ↓
Azure Custom Vision → classificarImagemAzure()
       ↓
Predição com confiança ≥ 70%?
  ├── NÃO → Erro amigável com sugestão de melhoria da foto
  └── SIM → Material identificado
               ↓
          Google Gemini 2.0 Flash → obterAnaliseSustentabilidade(material)
               ↓
          JSON com 6 campos ambientais:
          • impacto_ambiental
          • tempo_decomposicao
          • onde_descartar
          • reciclabilidade
          • dicas_sustentaveis
          • beneficios_reciclagem
```

**Detalhes de implementação:**

- **Threshold configurável** via `AI_CONFIDENCE_THRESHOLD` (padrão: 70%)
- **Fallback resiliente**: se o Gemini falhar ou retornar JSON inválido, uma análise básica pré-definida é retornada em `lib/ai/fallbacks/sustentabilidade.ts` — a UX não quebra
- **Validação de schema**: todos os 6 campos obrigatórios são verificados antes de aceitar a resposta da IA
- **Chat de IA**: endpoint `/api/ia/chat` expõe conversação livre com Gemini sobre temas ambientais, com histórico de mensagens por sessão

---

## 📡 Rotas da API

| Método          | Endpoint                   | Auth    | Cache | Descrição                      |
| --------------- | -------------------------- | ------- | ----- | ------------------------------ |
| POST            | `/api/auth`                | —       | —     | Login (cookie HttpOnly)        |
| DELETE          | `/api/auth`                | —       | —     | Logout                         |
| GET             | `/api/auth/me`             | ✅      | ✅    | Dados do usuário logado        |
| POST            | `/api/auth/refresh`        | ✅      | —     | Renovação de token JWT         |
| POST            | `/api/users`               | —       | —     | Cadastro público               |
| GET             | `/api/produtos`            | —       | ✅    | Listagem (filtros + paginação) |
| GET             | `/api/produtos/[id]`       | —       | ✅    | Detalhes do produto            |
| POST            | `/api/produtos`            | Admin   | —     | Criar produto                  |
| PUT             | `/api/produtos/[id]`       | Admin   | —     | Atualizar produto              |
| DELETE          | `/api/produtos/[id]`       | Admin   | —     | Remover produto                |
| GET/POST/DELETE | `/api/produtos/[id]/fotos` | ✅      | ✅    | Gerenciar fotos                |
| GET             | `/api/categorias`          | —       | ✅    | Listar categorias              |
| POST            | `/api/categorias`          | Admin   | —     | Criar categoria                |
| GET/PUT/DELETE  | `/api/categorias/[id]`     | —/Admin | ✅    | CRUD por id                    |
| GET             | `/api/marcas`              | —       | ✅    | Listar marcas                  |
| POST            | `/api/marcas`              | Admin   | —     | Criar marca                    |
| GET/PUT/DELETE  | `/api/marcas/[id]`         | —/Admin | ✅    | CRUD por id                    |
| GET             | `/api/certificados`        | —       | ✅    | Listar certificados            |
| POST            | `/api/certificados`        | Admin   | —     | Criar certificado              |
| GET/PUT/DELETE  | `/api/certificados/[id]`   | —/Admin | ✅    | CRUD por id                    |
| GET/POST        | `/api/usuarios`            | Admin   | ✅    | Listar / criar usuários        |
| GET/PUT/DELETE  | `/api/usuarios/[id]`       | Admin   | ✅    | Gerenciar por id               |
| POST            | `/api/ia/scan`             | ✅      | —     | Scanner de material            |
| POST            | `/api/ia/chat`             | ✅      | —     | Chat de sustentabilidade       |
| GET             | `/api/health`              | —       | —     | Health check da aplicação      |

---

## 🐳 Docker e Infraestrutura

O projeto é totalmente containerizado e pronto para rodar em qualquer ambiente com Docker.

### Serviços

| Serviço    | Imagem                    | Porta | Detalhes                                |
| ---------- | ------------------------- | ----- | --------------------------------------- |
| `app`      | Build local (multi-stage) | 3000  | Next.js em produção                     |
| `postgres` | postgres:16-alpine        | 5432  | Banco principal                         |
| `redis`    | redis:7-alpine            | 6379  | Cache e rate limiting                   |
| `migrate`  | Build local (one-shot)    | —     | Roda migrations + seed na inicialização |

Todos os serviços têm **healthcheck** configurado. O `app` aguarda Postgres e Redis estarem prontos antes de subir (`depends_on` com `condition: service_healthy`). O serviço `migrate` executa `prisma migrate deploy` + seed uma vez e não reinicia.

### Dockerfile multi-stage

```dockerfile
# Stage 1: deps — instala node_modules (camada cacheada pelo Docker)
# Stage 2: builder — gera Prisma Client + build Next.js
# Stage 3: runner — imagem final mínima, usuário não-root
```

### Comandos

```bash
# Sobe tudo (app + postgres + redis + migrations + seed)
docker compose up --build

# Em background
docker compose up --build -d

# Parar
docker compose down

# Reset completo (apaga volumes/banco)
docker compose down -v
```

---

## ⚙️ CI/CD

Pipeline com **GitHub Actions** (`.github/workflows/ci.yml`), disparado a cada push ou PR nas branches `main` e `develop`.

```
lint-and-build  →  docker  →  deploy
     ↑                ↑           ↑
  Todo PR/push   Push apenas  main apenas
```

| Job              | Trigger        | O que faz                                                                                                    |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `lint-and-build` | Push + PR      | Instala deps, gera Prisma Client, `next lint`, `tsc --noEmit`, `next build`                                  |
| `docker`         | Push           | Build multi-stage + push para GitHub Container Registry com tags `latest` e `sha-<commit>`                   |
| `deploy`         | Push na `main` | SSH no servidor, pull da nova imagem, recria o container da app sem derrubar Postgres/Redis, roda migrations |

### Secrets necessários

| Secret            | Descrição                             |
| ----------------- | ------------------------------------- |
| `SSH_HOST`        | IP ou domínio do servidor de produção |
| `SSH_USER`        | Usuário SSH                           |
| `SSH_PRIVATE_KEY` | Chave privada SSH (formato PEM)       |

O `GITHUB_TOKEN` para publicar no ghcr.io é provido automaticamente pelo GitHub Actions.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado)
- Chaves de API do Google Gemini e Azure Custom Vision (opcionais — scanner retorna erro amigável sem elas)

### Com Docker Compose (recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env: JWT_SECRET, GEMINI_KEY, AZURE_VISION_ENDPOINT, AZURE_VISION_KEY
# DATABASE_URL e REDIS_URL são sobrescritos automaticamente pelo Compose

# Sobe tudo (app + banco + cache + migrations + seed)
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000).

**Credenciais padrão do seed (desenvolvimento):**

| Papel   | Email               | Senha        |
| ------- | ------------------- | ------------ |
| Admin   | admin@ecoshop.com   | Admin@123456 |
| Cliente | cliente@ecoshop.com | Senha@123    |

### Sem Docker (Node.js local)

```bash
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

npm install

cp .env.example .env.local
# Edite .env.local com suas credenciais

npx prisma migrate dev
npx prisma db seed

# Redis local (opcional via Docker)
docker run -d -p 6379:6379 redis:alpine

npm run dev
```

### Scripts disponíveis

| Comando                  | Descrição                             |
| ------------------------ | ------------------------------------- |
| `npm run dev`            | Servidor de desenvolvimento           |
| `npm run build`          | Build de produção                     |
| `npm run start`          | Servidor em modo produção             |
| `npm run lint`           | Linter                                |
| `npm run typecheck`      | Type check sem emitir arquivos        |
| `npx prisma migrate dev` | Aplica migrations + sincroniza schema |
| `npx prisma db seed`     | Popula o banco com dados iniciais     |
| `npx prisma studio`      | Interface visual do banco             |

---

## 🔑 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ecoshop"
REDIS_URL="redis://localhost:6379"

# Autenticação JWT (mínimo 32 caracteres)
JWT_SECRET="sua-chave-secreta-aqui"

# Google Gemini
GEMINI_KEY="sua-chave-gemini"

# Azure Custom Vision
AZURE_VISION_ENDPOINT="https://seu-recurso.cognitiveservices.azure.com/"
AZURE_VISION_KEY="sua-chave-azure"

# Threshold de confiança da IA (padrão: 0.7)
AI_CONFIDENCE_THRESHOLD=0.7

# URL pública (opcional)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Seed do administrador (apenas desenvolvimento)
ADMIN_EMAIL="admin@ecoshop.com"
ADMIN_PASSWORD="Admin@123456"
ADMIN_NAME="Administrador EcoShop"
```

> **Degradação graciosa:** Redis offline → aplicação busca direto no banco. Gemini/Azure offline → scanner retorna mensagem amigável. Nenhum dos dois derruba a aplicação.

---

## 📁 Estrutura de Pastas

```
ecoshop/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Pipeline CI/CD
├── app/
│   ├── (admin)/painel/             # Dashboard administrativo
│   ├── (auth)/sign-in/             # Página de login
│   ├── (educacao)/educacao/        # Conteúdo educacional
│   ├── (ia-scan)/ia-scan/          # Scanner de materiais com IA
│   ├── (perfil)/perfil/            # Perfil do usuário
│   ├── (sobre)/about/              # Sobre a plataforma
│   ├── (store)/produtos/           # Catálogo
│   │   └── [id]/                   # Página dinâmica de produto
│   ├── api/                        # Route Handlers (REST)
│   │   ├── auth/                   # Login, logout, me, refresh
│   │   ├── categorias/             # CRUD de categorias
│   │   ├── certificados/           # CRUD de certificados
│   │   ├── ia/                     # scan + chat
│   │   ├── marcas/                 # CRUD de marcas
│   │   ├── produtos/               # CRUD + fotos
│   │   ├── users/                  # Cadastro público
│   │   ├── usuarios/               # Gestão admin
│   │   └── health/                 # Health check
│   ├── _middleware/
│   │   └── auth.ts                 # Helpers de autenticação para Route Handlers
│   ├── components/
│   │   └── Header.tsx              # Header compartilhado
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Home
├── config/
│   └── rotas-protegidas.ts         # Regras de acesso desacopladas do middleware
├── lib/
│   ├── ai/
│   │   ├── analisar-imagem.ts      # Azure Custom Vision + Gemini
│   │   └── fallbacks/
│   │       └── sustentabilidade.ts # Fallback para IA offline
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCategorias.ts
│   │   ├── useCertificados.ts
│   │   ├── useFetch.ts             # Cache in-memory + stale-while-revalidate
│   │   ├── useFotos.ts
│   │   ├── useIA.ts                # Scan e chat
│   │   ├── useMarcas.ts
│   │   ├── useMutation.ts          # Mutações + invalidação de cache
│   │   └── useProdutos.ts
│   ├── http/
│   │   └── responses.ts            # Helpers de resposta HTTP padronizados
│   ├── schemas/                    # Schemas Zod por entidade
│   │   ├── categoria.ts
│   │   ├── certificado.ts
│   │   ├── ia-chat.ts
│   │   ├── marca.ts
│   │   ├── produto.ts
│   │   └── usuario.ts
│   ├── rate-limit.ts               # Rate limiting via Redis
│   └── redis.ts                    # Singleton + redisGet/redisSet/redisDel/delPattern
├── prints/                         # Screenshots da interface
├── prisma/
│   ├── migrations/                 # Histórico de migrations versionadas
│   ├── schema.prisma               # Modelo de dados
│   ├── seed.ts                     # Dados iniciais para desenvolvimento
│   └── seed-admin.ts               # Seed do administrador (configurável por .env)
├── public/
│   └── data_fotos/                 # Fotos dos produtos (servidas estaticamente)
├── services/                       # Regras de negócio e acesso ao banco
│   ├── categoria.service.ts
│   ├── certificado.service.ts
│   ├── foto.service.ts
│   ├── marca.service.ts
│   ├── produto.service.ts
│   └── usuario.service.ts
├── types/                          # Tipos TypeScript do domínio e da API
│   ├── ai.ts
│   ├── api.ts
│   ├── auth.ts
│   └── domain.ts
├── .dockerignore
├── .env.example                    # Template de variáveis de ambiente
├── .gitignore
├── docker-compose.yml              # Orquestração (app + postgres + redis + migrate)
├── Dockerfile                      # Build multi-stage
├── middleware.ts                   # Edge Middleware — autenticação e autorização
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.seed.json              # tsconfig isolado para o seed do Prisma
```

---

## 📄 Licença

Projeto desenvolvido para fins de portfólio. Livre para uso como referência.
