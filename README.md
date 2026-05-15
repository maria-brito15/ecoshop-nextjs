# 🌿 EcoShop

> Plataforma de e-commerce sustentável com análise de materiais por IA, desenvolvida com Next.js 15, TypeScript, PostgreSQL, Redis e integração com Azure Custom Vision + Google Gemini.

[![CI/CD](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## 🇺🇸 [English Version](./README-en.md)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Segurança](#-autenticação-e-segurança)
- [Cache com Redis](#-cache-com-redis)
- [Integração com IA](#-integração-com-ia)
- [Rotas da API](#-rotas-da-api)
- [Docker e Infraestrutura](#-docker-e-infraestrutura)
- [CI/CD](#️-cicd)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas](#-estrutura-de-pastas)

---

## 🌱 Sobre o Projeto

O **EcoShop** é um e-commerce voltado para produtos sustentáveis que vai além da venda: oferece um scanner inteligente de materiais recicláveis via câmera, conteúdo de educação ambiental e um painel administrativo completo para gestão de produtos, marcas, categorias, certificados e usuários.

O projeto foi desenvolvido como uma aplicação full-stack com foco em boas práticas de engenharia de software, incluindo:

- Separação de responsabilidades com Route Groups do App Router
- Tipagem estrita com TypeScript 5
- Validação de entrada com Zod
- Autenticação stateless com JWT (via `jose` + `bcryptjs`)
- Cache em duas camadas com Redis no servidor e `Map` em memória no cliente
- Degradação graciosa de serviços externos (Redis e IA)

---

## ✨ Funcionalidades

### Para Usuários

- 🛒 **Catálogo de Produtos** — listagem com filtros por categoria e marca, paginação e busca
- 🔍 **Página de Produto** — detalhes completos, fotos, certificados de sustentabilidade e marca responsável
- 📸 **IA Scan** — scanner que identifica o material de um objeto por foto e retorna análise ambiental completa (tempo de decomposição, como e onde descartar, dicas sustentáveis e benefícios da reciclagem)
- 🎓 **Seção Educação** — conteúdo curado sobre consumo consciente e reciclagem
- 👤 **Perfil de Usuário** — gerenciamento de dados pessoais com controle de acesso por role
- 💬 **Chat de Sustentabilidade** — assistente de IA para tirar dúvidas sobre práticas sustentáveis

### Para Administradores

- 📊 **Painel Admin** — dashboard completo com gestão de produtos, categorias, marcas, certificados e usuários
- 🖼️ **Upload de Fotos** — gerenciamento de imagens de produtos diretamente pela interface
- 👥 **Gestão de Usuários** — listagem, edição e controle de roles (ADMIN, CLIENTE, MARCA)

---

## 🛠 Stack Tecnológica

| Camada                               | Tecnologia                      |
| ------------------------------------ | ------------------------------- |
| **Framework**                        | Next.js 15 (App Router)         |
| **Linguagem**                        | TypeScript 5                    |
| **Estilização**                      | Tailwind CSS 4                  |
| **Banco de Dados**                   | PostgreSQL                      |
| **ORM**                              | Prisma 7 (`@prisma/adapter-pg`) |
| **Cache**                            | Redis 4 (`redis`)               |
| **Autenticação**                     | JWT via `jose` + `bcryptjs`     |
| **Validação**                        | Zod 3                           |
| **IA — Visão Computacional**         | Azure Custom Vision             |
| **IA — Análise de Sustentabilidade** | Google Gemini 2.0 Flash         |
| **Containerização**                  | Docker + Docker Compose         |
| **CI/CD**                            | GitHub Actions + ghcr.io        |

---

## 🏗 Arquitetura

O projeto utiliza o **App Router do Next.js 15** com Route Groups para organizar as páginas por domínio, mantendo separação clara de contextos:

```
app/
├── (admin)/painel        → Área administrativa (role: ADMIN)
├── (auth)/sign-in        → Autenticação
├── (educacao)/educacao   → Conteúdo educacional
├── (ia-scan)/ia-scan     → Scanner de materiais (autenticado)
├── (perfil)/perfil       → Perfil do usuário (autenticado)
├── (sobre)/about         → Sobre a plataforma
├── (store)/produtos      → Catálogo e página de produto
├── api/                  → API Routes (REST)
└── page.tsx              → Home com scroll reveal e categorias dinâmicas
```

O **Middleware do Next.js** (`middleware.ts`) protege as rotas de forma centralizada, com três níveis de acesso:

1. **Rotas públicas** — sem restrição
2. **Rotas autenticadas** — `/ia-scan`, `/perfil` — exigem token JWT válido
3. **Rotas admin** — `/painel`, `/api/admin`, `/api/usuarios` — exigem `tipo === "ADMIN"`

Usuários não autenticados são redirecionados para `/sign-in?next=<rota_original>`. APIs retornam `401` ou `403` sem vazar detalhes internos.

### Fluxo de Autenticação

```
Login → POST /api/auth → bcrypt.compare(senha, hash)
      → signJWT({ id, tipo }) → Cookie HttpOnly (7 dias)
      → Requisições subsequentes → Middleware → verifyToken → payload
```

---

## 🗃 Banco de Dados

O schema foi modelado com Prisma 7 e reflete as entidades do domínio de e-commerce sustentável:

```prisma
Usuario        → tipo: ADMIN | CLIENTE | MARCA
Marca          → 1:1 com Usuario (tipo MARCA)
Categoria      → 1:N com Produto
Certificado    → N:N com Produto (via ProdutoCertificado)
Produto        → pertence a Marca e Categoria, possui fotos e certificados
```

**Destaques do modelo:**

- Enum `TipoUsuario` (ADMIN, CLIENTE, MARCA) para controle de roles diretamente no banco
- Relação N:N explícita entre `Produto` e `Certificado` via tabela de junção `produto_certificado`
- Campo `fotoUrl` no produto com suporte a múltiplas fotos via endpoint dedicado (`/api/produtos/[id]/fotos`)
- Seed completo com dados iniciais para desenvolvimento (`prisma/seed.ts`), executado com `npx prisma db seed`

---

## 🔐 Autenticação e Segurança

- **JWT stateless** com expiração de 7 dias, assinado com HS256 via biblioteca `jose`
- **Senhas criptografadas** com `bcryptjs` (hash com salt rounds padrão)
- **Middleware centralizado** (`middleware.ts`) com matcher configurado para rodar apenas nas rotas necessárias, evitando overhead em assets estáticos
- Rotas de API retornam `401 Unauthorized` (não autenticado) ou `403 Forbidden` (sem permissão) sem vazar detalhes internos
- Suporte a redirecionamento pós-login via parâmetro `?next=`

```ts
// Rotas protegidas configuradas no matcher
matcher: [
  "/painel/:path*",
  "/perfil/:path*",
  "/ia-scan/:path*",
  "/api/admin/:path*",
  "/api/usuarios/:path*",
  "/api/produtos/:path*/fotos",
];
```

---

## ⚡ Cache com Redis

O projeto implementa cache em duas camadas para reduzir latência e diminuir a carga no banco de dados.

### Camada do servidor — Redis (`lib/redis.ts` + `lib/cache.ts`)

Todas as rotas de GET cacheiam suas respostas no Redis com TTLs calibrados por tipo de recurso:

| Recurso                          | TTL   |
| -------------------------------- | ----- |
| Categorias, marcas, certificados | 5 min |
| Produtos (listagem paginada)     | 2 min |
| Produto, categoria, marca por id | 3 min |
| Dados de usuário e sessão        | 1 min |
| Listagem de fotos (filesystem)   | 2 min |

Mutações (POST, PUT, DELETE) invalidam as entradas afetadas imediatamente após gravar no banco:

- `invalidarCache("PRODUTOS")` — remove `produtos:*` (via `SCAN` + `DEL`, sem bloquear o Redis)
- `redisDel("produtos:42")` — remove item específico por id

O cliente Redis é instanciado como singleton no `globalThis` para sobreviver aos hot-reloads do Next.js. Erros de conexão são logados como `console.warn` sem derrubar a aplicação — Redis é cache, não dado primário.

### Camada do cliente — memória (`lib/hooks/useFetch.ts`)

O hook `useFetch` mantém um `Map` em memória com TTL de 30 segundos e implementa a estratégia **stale-while-revalidate**:

- Retorna o cache instantaneamente (sem tela de loading)
- Revalida em background após a resposta exibida
- Atualiza o estado React apenas se os dados mudaram

O hook `useMutation` invalida as entradas do cache do cliente após cada mutação bem-sucedida, em sincronia com a invalidação no Redis feita pelo servidor.

### Fluxo de leitura completo

```
useFetch (cliente)
  → Map em memória hit? → retorna imediatamente + revalida em background
  → Map miss → fetch(url)
      → Route Handler → comCache(chave, ttl, fetcher)
          → Redis hit? → retorna JSON
          → Redis miss → prisma.findMany() → redisSet(chave, dados, ttl) → retorna
```

---

## 🤖 Integração com IA

### Fluxo do Scanner (`/ia-scan`)

```
Foto do usuário (base64 ou File)
       ↓
Azure Custom Vision → classificarImagemAzure()
       ↓
Predição com confiança ≥ 70%?
  ├── NÃO → Retorna erro com sugestão de melhoria da foto
  └── SIM → Material identificado
               ↓
          Google Gemini 2.0 Flash → obterAnaliseSustentabilidade(material)
               ↓
          JSON estruturado com 6 campos ambientais:
          • impacto_ambiental
          • tempo_decomposicao
          • onde_descartar
          • reciclabilidade
          • dicas_sustentaveis
          • beneficios_reciclagem
```

**Detalhes de implementação (`lib/ai.ts`):**

- **Threshold de confiança configurável** — `CONFIANCA_MINIMA = 0.7` (70%)
- **Fallback resiliente** — se o Gemini falhar ou retornar JSON inválido, uma análise básica pré-definida é retornada sem quebrar a UX
- **Validação de schema** — todos os 6 campos obrigatórios são verificados antes de aceitar a resposta da IA
- **Chat de sustentabilidade** — endpoint `/api/ia/chat` permite conversação livre com o Gemini sobre temas ambientais

---

## 📡 Rotas da API

| Método          | Endpoint                   | Auth      | Cache | Descrição                                    |
| --------------- | -------------------------- | --------- | ----- | -------------------------------------------- |
| POST            | `/api/auth`                | —         | —     | Login (retorna cookie HttpOnly)              |
| DELETE          | `/api/auth`                | —         | —     | Logout (limpa cookie)                        |
| GET             | `/api/auth/me`             | ✅        | ✅    | Dados do usuário logado                      |
| POST            | `/api/auth/refresh`        | ✅        | —     | Renovação de token JWT                       |
| POST            | `/api/users`               | —         | —     | Cadastro público de usuário                  |
| GET             | `/api/produtos`            | —         | ✅    | Listagem de produtos (com filtros/paginação) |
| GET             | `/api/produtos/[id]`       | —         | ✅    | Detalhes de um produto                       |
| PUT             | `/api/produtos/[id]`       | Admin     | —     | Atualizar produto (invalida cache)           |
| DELETE          | `/api/produtos/[id]`       | Admin     | —     | Remover produto (invalida cache)             |
| GET/POST/DELETE | `/api/produtos/[id]/fotos` | ✅        | ✅    | Gerenciar fotos do produto                   |
| GET             | `/api/categorias`          | —         | ✅    | Listar categorias                            |
| POST            | `/api/categorias`          | Admin     | —     | Criar categoria (invalida cache)             |
| GET/PUT/DELETE  | `/api/categorias/[id]`     | — / Admin | ✅    | CRUD de categoria por id                     |
| GET             | `/api/marcas`              | —         | ✅    | Listar marcas                                |
| POST            | `/api/marcas`              | Admin     | —     | Criar marca (invalida cache)                 |
| GET/PUT/DELETE  | `/api/marcas/[id]`         | — / Admin | ✅    | CRUD de marca por id                         |
| GET             | `/api/certificados`        | —         | ✅    | Listar certificados                          |
| POST            | `/api/certificados`        | Admin     | —     | Criar certificado (invalida cache)           |
| GET/PUT/DELETE  | `/api/certificados/[id]`   | — / Admin | ✅    | CRUD de certificado por id                   |
| GET/POST        | `/api/usuarios`            | Admin     | ✅    | Listar / criar usuários                      |
| GET/PUT/DELETE  | `/api/usuarios/[id]`       | Admin     | ✅    | Gerenciar usuário por id                     |
| POST            | `/api/ia/scan`             | ✅        | —     | Scanner de material por imagem               |
| POST            | `/api/ia/chat`             | ✅        | —     | Chat com assistente de sustentabilidade      |

---

## 🐳 Docker e Infraestrutura

O projeto é totalmente containerizado com Docker e Docker Compose, cobrindo todos os serviços necessários para rodar em produção.

### Serviços

| Serviço    | Imagem             | Porta |
| ---------- | ------------------ | ----- |
| `app`      | Build local        | 3000  |
| `postgres` | postgres:16-alpine | 5432  |
| `redis`    | redis:7-alpine     | 6379  |
| `migrate`  | Build local (1×)   | —     |

O serviço `migrate` executa `prisma migrate deploy` + `prisma db seed` automaticamente na primeira inicialização e não reinicia após isso. Todos os serviços têm **healthcheck** configurado — o `app` só sobe após o Postgres e o Redis estarem prontos.

### Comandos

```bash
# build e sobe todos os serviços
docker compose up --build

# em background
docker compose up --build -d

# parar tudo
docker compose down

# parar e remover volumes (reset completo do banco)
docker compose down -v
```

### Dockerfile multi-stage

```
deps     → instala dependências (node_modules)
builder  → gera o Prisma Client e roda o build do Next.js
runner   → copia apenas o necessário, roda com usuário não-root
```

---

## ⚙️ CI/CD

O pipeline está configurado com **GitHub Actions** em `.github/workflows/ci.yml` e roda automaticamente a cada push ou PR nas branches `main` e `develop`.

```
lint-and-build  →  docker  →  deploy
     ↑               ↑            ↑
  Todo PR/push   Push apenas   main apenas
```

| Job              | Trigger        | O que faz                                                                                                 |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `lint-and-build` | Push + PR      | Instala deps, gera Prisma Client, roda lint, type-check e build                                           |
| `docker`         | Push           | Builda imagem multi-stage e publica no GitHub Container Registry com tags `latest` e `sha-<commit>`       |
| `deploy`         | Push na `main` | SSH no servidor, puxa nova imagem, recria o container da app sem derrubar Postgres/Redis, roda migrations |

### Secrets necessários (`Settings → Secrets → Actions`)

| Secret            | Descrição                       |
| ----------------- | ------------------------------- |
| `SSH_HOST`        | IP ou domínio do servidor       |
| `SSH_USER`        | Usuário SSH                     |
| `SSH_PRIVATE_KEY` | Chave privada SSH (formato PEM) |

> O `GITHUB_TOKEN` usado para publicar no ghcr.io é provido automaticamente pelo GitHub.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente ou via Docker
- Redis rodando localmente ou via Docker
- Chaves de API do Google Gemini e Azure Custom Vision (opcionais — apenas para funcionalidades de IA)

### Com Docker Compose (recomendado)

```bash
# clone o repositório
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

# configure as variáveis de ambiente (chaves de api, jwt secret)
cp .env.example .env
# edite o .env — DATABASE_URL e REDIS_URL serão sobrescritos pelo compose automaticamente

# sobe tudo (app + postgres + redis + migrations + seed)
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000).

### Sem Docker (Node.js local)

```bash
# clone o repositório
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

# instale as dependências
npm install

# configure as variáveis de ambiente
cp .env.example .env.local
# edite o .env.local com suas credenciais

# rode as migrations e popule o banco com dados iniciais
npx prisma migrate dev
npx prisma db seed

# inicie o Redis (caso não tenha instalado localmente)
docker run -d -p 6379:6379 redis:alpine

# inicie o servidor de desenvolvimento
npm run dev
```

### Scripts disponíveis

| Comando                  | Descrição                               |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Inicia o servidor de desenvolvimento    |
| `npm run build`          | Gera o build de produção                |
| `npm run start`          | Inicia o servidor em modo produção      |
| `npm run lint`           | Executa o linter                        |
| `npx prisma migrate dev` | Aplica migrations e sincroniza o schema |
| `npx prisma db seed`     | Popula o banco com dados iniciais       |
| `npx prisma studio`      | Abre o Prisma Studio (UI do banco)      |

---

## 🔑 Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# JWT
JWT_SECRET="your-secret-key-here"

# Google Gemini
GEMINI_KEY="your-gemini-key-here"

# Azure Custom Vision
AZURE_VISION_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
AZURE_VISION_KEY="your-azure-key-here"

# Next.js
NODE_ENV="development"

# Redis
REDIS_URL="redis://localhost:6379"
```

> **Degradação graciosa:** As funcionalidades de IA continuam funcionando sem as chaves do Gemini/Azure — o scanner retorna um erro amigável. O Redis também degrada graciosamente: se offline, as requisições vão direto ao banco sem afetar o funcionamento da aplicação.

---

## 📁 Estrutura de Pastas

```
ecoshop/
├── .github/
│   └── workflows/
│       └── ci.yml            # Pipeline de CI/CD (lint, build, docker, deploy)
├── app/
│   ├── (admin)/painel/       # Dashboard administrativo
│   ├── (auth)/sign-in/       # Página de login
│   ├── (educacao)/educacao/  # Conteúdo educacional
│   ├── (ia-scan)/ia-scan/    # Scanner de materiais com IA
│   ├── (perfil)/perfil/      # Perfil do usuário
│   ├── (sobre)/about/        # Sobre a plataforma
│   ├── (store)/produtos/     # Catálogo e página de produto
│   │   └── [id]/             # Página dinâmica de produto
│   ├── api/
│   │   ├── auth/             # Login, logout, me, refresh
│   │   ├── categorias/       # CRUD de categorias
│   │   ├── certificados/     # CRUD de certificados
│   │   ├── ia/               # Endpoints de IA (scan, chat)
│   │   ├── marcas/           # CRUD de marcas
│   │   ├── produtos/         # CRUD de produtos e fotos
│   │   ├── users/            # Cadastro público
│   │   └── usuarios/         # Gestão de usuários (admin)
│   ├── components/
│   │   └── Header.tsx        # Header compartilhado
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Home
├── lib/
│   ├── ai.ts                 # Integração Azure Custom Vision + Gemini
│   ├── api.ts                # Helpers de fetch para o cliente
│   ├── auth.ts               # JWT sign/verify
│   ├── cache.ts              # Helpers de cache e invalidação (comCache, invalidarCache)
│   ├── db.ts                 # Instância singleton do Prisma Client
│   ├── redis.ts              # Cliente Redis singleton (redisGet, redisSet, redisDel)
│   └── hooks/
│       ├── useAuth.ts        # Hook de autenticação
│       ├── useCategorias.ts  # Hook de categorias
│       ├── useCertificados.ts
│       ├── useFetch.ts       # Cache em memória + stale-while-revalidate
│       ├── useFotos.ts       # Gerenciamento de fotos
│       ├── useIA.ts          # Hook de IA (scan e chat)
│       ├── useMarcas.ts
│       ├── useMutation.ts    # Mutações com invalidação de cache do cliente
│       └── useProdutos.ts
├── prints/                   # Screenshots da interface para documentação
├── prisma/
│   ├── migrations/           # Histórico de migrations
│   ├── schema.prisma         # Modelo de dados
│   └── seed.ts               # Dados iniciais para desenvolvimento
├── public/
│   └── data_fotos/           # Fotos dos produtos (servidas estaticamente)
├── types/
│   └── api.ts                # Tipos TypeScript das respostas da API
├── .dockerignore             # Arquivos excluídos do contexto de build do Docker
├── .env.example              # Template de variáveis de ambiente
├── .gitignore
├── docker-compose.yml        # Orquestração local (app + postgres + redis + migrate)
├── Dockerfile                # Build multi-stage da aplicação
├── middleware.ts             # Proteção centralizada de rotas
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.seed.json        # Configuração TypeScript isolada para o seed do Prisma
```

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de portfólio.
