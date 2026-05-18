# 🌿 EcoShop

> A full-stack sustainable e-commerce platform featuring an AI-powered material scanner, built as a portfolio project with Next.js 15, TypeScript, PostgreSQL, Redis, Docker, and integration with Azure Custom Vision + Google Gemini 2.0 Flash.

[![CI/CD](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)

🇧🇷 [Versão em Português](./README.md)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Notable Technical Decisions](#-notable-technical-decisions)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database](#-database)
- [Authentication & Security](#-authentication--security)
- [Two-Layer Cache](#-two-layer-cache)
- [AI Integration](#-ai-integration)
- [API Routes](#-api-routes)
- [Docker & Infrastructure](#-docker--infrastructure)
- [CI/CD](#️-cicd)
- [Running Locally](#-running-locally)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)

---

## 🌱 About the Project

**EcoShop** is a full-stack e-commerce platform for sustainable products, built as a portfolio project focused on real-world software engineering practices.

It goes well beyond a standard CRUD: the platform features an **AI-powered recyclable material scanner** (Azure Custom Vision + Gemini), a **complete admin dashboard** for managing products, brands, categories, certificates and users, plus a **sustainability AI chat** assistant.

From an engineering standpoint, the project applies production-grade patterns:

- Layered architecture with clear separation of concerns (Route Groups, Services, Hooks, Schemas, Types)
- Stateless authentication via JWT in an Edge Middleware, with no server-side session
- Two-layer caching (Redis server-side + in-memory `Map` on the client with stale-while-revalidate)
- Selective cache invalidation by key pattern (`SCAN` + `DEL` without blocking Redis)
- Graceful degradation for external services: Redis and AI failures don't bring down the app
- Full containerization with multi-stage Docker and Compose orchestration
- CI/CD pipeline with GitHub Actions: lint, type-check, build, push to ghcr.io, SSH deploy

---

## 🔬 Notable Technical Decisions

This section highlights the most relevant architectural choices for technical evaluators.

### Two-layer cache with stale-while-revalidate

The application implements caching at two independent levels:

**Server (Redis):** every GET route stores its response in Redis with a TTL calibrated per resource type (1–5 min). Mutations immediately invalidate affected keys using `scanIterator` (non-blocking) + batch `DEL`. The `comCache(key, ttl, fetcher)` function encapsulates this pattern, keeping Route Handlers clean.

**Client (in-memory Map):** the `useFetch` hook maintains a `Map` with a 30-second TTL and implements stale-while-revalidate: it returns the cache instantly (no loading screen), fires a background fetch, and updates React state only if the data changed. The `useMutation` hook synchronizes client-side cache invalidation with server mutations.

```
useFetch (client)
  → Map hit? → return immediately + revalidate in background
  → Map miss → fetch(url)
      → Route Handler → comCache(key, ttl, fetcher)
          → Redis hit? → return JSON
          → Redis miss → Prisma → redisSet() → return
```

### Edge Middleware for auth and authorization

`middleware.ts` runs in **Next.js's Edge Runtime** and handles all authentication and access control before any Route Handler executes. This prevents security logic from being scattered across pages and APIs.

Access rules are centralized in `config/rotas-protegidas.ts`, decoupled from the middleware itself. Three access levels:

1. **Public** — no restriction
2. **Authenticated** — requires a valid JWT cookie
3. **Admin** — requires `tipo === "ADMIN"` in the token payload

Unauthenticated page requests are redirected to `/sign-in?next=<original_route>`. APIs return `401` or `403` as JSON without leaking internal details.

### Zod schema validation at the edges

All endpoints validate the request body against Zod schemas defined in `lib/schemas/`, before any database operation. Validation errors return `400` with a list of invalid fields. This eliminates an entire class of malformed-data bugs and implicitly documents each endpoint's contract.

### Prisma Client singleton resistant to hot-reload

In development, Next.js restarts modules on every file change. Without care, each hot-reload would open a new connection pool, exhausting database connections. The Prisma client is instantiated as a singleton on `globalThis`, surviving reloads. The same pattern is applied to the Redis client.

### Graceful degradation for external services

Redis and AI are optional in the architecture:

- **Redis offline**: `redisGet` returns `null` and `redisSet` is silenced. The app reads from the database without affecting users.
- **Azure Vision offline**: the scanner returns a user-friendly error without breaking other features.
- **Gemini offline or invalid JSON**: `obterAnaliseSustentabilidade()` returns a pre-defined fallback from `lib/ai/fallbacks/sustentabilidade.ts` instead of propagating the exception.

### Optimized multi-stage Dockerfile

```
deps     → install node_modules (Docker layer cache)
builder  → generate Prisma Client + Next.js build
runner   → copy only required artifacts, run as non-root user
```

The final image carries no devDependencies or source code, significantly reducing its size.

---

## ✨ Features

### For Users

- 🛒 **Product Catalog** — browsable listings with category and brand filters, pagination, and search
- 🔍 **Product Page** — full details, photo gallery, sustainability certificates, and responsible brand info
- 📸 **AI Scan** — camera-based scanner that identifies an object's material and returns a complete environmental analysis: decomposition time, disposal instructions, sustainable tips, and recycling benefits
- 🎓 **Education Section** — curated content on conscious consumption and recycling
- 👤 **User Profile** — personal data management with role-based access control
- 💬 **Sustainability Chat** — AI assistant for sustainable practice questions

### For Administrators

- 📊 **Admin Panel** — full dashboard for managing products, categories, brands, certificates, and users
- 🖼️ **Photo Upload** — product image management directly from the interface
- 👥 **User Management** — list, edit, and manage roles (ADMIN, CLIENT, BRAND)

---

## 🛠 Tech Stack

| Layer                           | Technology                             |
| ------------------------------- | -------------------------------------- |
| **Framework**                   | Next.js 15 (App Router)                |
| **Language**                    | TypeScript 5                           |
| **Styling**                     | Tailwind CSS 4                         |
| **Database**                    | PostgreSQL 16                          |
| **ORM**                         | Prisma 7 (`@prisma/adapter-pg`)        |
| **Cache**                       | Redis 7 (`redis` v4)                   |
| **Authentication**              | JWT via `jose` + `bcryptjs`            |
| **Validation**                  | Zod 3                                  |
| **AI — Computer Vision**        | Azure Custom Vision                    |
| **AI — Environmental Analysis** | Google Gemini 2.0 Flash                |
| **Containerization**            | Docker + Docker Compose                |
| **CI/CD**                       | GitHub Actions + ghcr.io               |
| **Runtime**                     | Node.js 20 + Edge Runtime (Middleware) |

---

## 🏗 Architecture

The project uses **Next.js 15's App Router** with Route Groups to isolate each area's context:

```
app/
├── (admin)/painel/        → Admin area (role: ADMIN)
├── (auth)/sign-in/        → Authentication
├── (educacao)/educacao/   → Educational content
├── (ia-scan)/ia-scan/     → Material scanner (authenticated)
├── (perfil)/perfil/       → User profile (authenticated)
├── (sobre)/about/         → About the platform
├── (store)/produtos/      → Catalog and product pages
│   └── [id]/              → Dynamic product route
├── api/                   → API Routes (REST)
│   ├── auth/              → Login, logout, me, refresh
│   ├── categorias/        → Category CRUD
│   ├── certificados/      → Certificate CRUD
│   ├── ia/                → scan and chat
│   ├── marcas/            → Brand CRUD
│   ├── produtos/          → Product CRUD + photos
│   ├── users/             → Public registration
│   └── usuarios/          → Admin user management
└── page.tsx               → Home with scroll reveal and dynamic categories
```

**Layers beyond `app/`:**

```
lib/
├── ai/                    → Azure Custom Vision + Gemini integration
│   └── fallbacks/         → Fallback responses for AI offline
├── hooks/                 → Data hooks (useFetch, useMutation, useAuth, ...)
├── http/                  → Standardized HTTP response helpers
├── schemas/               → Zod schemas per entity
├── rate-limit.ts          → Redis-based rate limiting
└── redis.ts               → Singleton client + helpers (get/set/del/delPattern)

services/                  → Business logic and database access (Prisma)
types/                     → TypeScript types for domain and API
config/                    → Protected route configuration
```

### Authentication Flow

```
POST /api/auth
  → bcrypt.compare(password, hash)
  → signJWT({ id, tipo }, JWT_SECRET)
  → HttpOnly Cookie (7 days, SameSite=Strict)

Subsequent requests:
  → Edge Middleware → verifyToken(cookie) → payload
  → Protected route? → check tipo → allow or block
```

---

## 🗃 Database

Schema modeled with Prisma 7 and PostgreSQL, reflecting the sustainable e-commerce domain:

```prisma
Usuario        → tipo: ADMIN | CLIENTE | MARCA (DB-level enum)
Marca          → 1:1 with Usuario (tipo MARCA)
Categoria      → 1:N with Produto
Certificado    → N:N with Produto (via explicit ProdutoCertificado join table)
Produto        → belongs to Marca and Categoria, has multiple photos and certificates
```

**Schema highlights:**

- `TipoUsuario` PostgreSQL enum for end-to-end type safety (database → Prisma → TypeScript)
- Explicit N:N join table `produto_certificado` — more flexible than Prisma's implicit many-to-many for future field additions
- Full development seed (`prisma/seed.ts`) and a separate admin seed (`prisma/seed-admin.ts`) configurable via environment variables
- Versioned migrations in `prisma/migrations/` with `migration_lock.toml` for cross-environment consistency

---

## 🔐 Authentication & Security

- **Stateless JWT** with 7-day expiry, HS256-signed via `jose` (Edge Runtime compatible)
- **Hashed passwords** with `bcryptjs` (hash + default salt rounds)
- **Centralized Edge Middleware**: runs before any handler, no Node.js overhead
- Access rules decoupled in `config/rotas-protegidas.ts` — adding a protected route doesn't require touching the middleware
- **Rate limiting** on sensitive endpoints (login, registration) via Redis sliding window
- APIs return `401 Unauthorized` or `403 Forbidden` as JSON without leaking stack traces
- Post-login redirect via `?next=<route>` preserves user navigation intent

```ts
// Routes covered by the middleware matcher
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

## ⚡ Two-Layer Cache

### Server — Redis

All GET routes go through `comCache(key, ttl, fetcher)`, which checks Redis before querying the database:

| Resource                         | TTL   |
| -------------------------------- | ----- |
| Categories, brands, certificates | 5 min |
| Products (paginated listing)     | 2 min |
| Product, category, brand by id   | 3 min |
| User data and session            | 1 min |
| Product photos                   | 2 min |

Mutations (POST, PUT, DELETE) immediately invalidate the cache after writing to the database. For key patterns (e.g., `produtos:*`), invalidation uses `scanIterator` + batch `DEL` — not `KEYS *`, which would block Redis.

The Redis client is a singleton on `globalThis` to survive Next.js hot-reloads. Connection failures are silenced with `console.warn` — the database handles reads with no user impact.

### Client — In-memory Map

The `useFetch` hook implements stale-while-revalidate:

1. Returns local cache instantly (zero loading screen for cached data)
2. Fires background revalidation after a 30-second TTL
3. Updates React state using `JSON.stringify` diff to avoid unnecessary re-renders

The `useMutation` hook invalidates local Map entries after each mutation, in sync with Redis invalidation on the server.

---

## 🤖 AI Integration

### Scanner Pipeline (`/ia-scan`)

```
User photo (base64 or File)
       ↓
Azure Custom Vision → classificarImagemAzure()
       ↓
Prediction confidence ≥ 70%?
  ├── NO  → User-friendly error with photo improvement suggestions
  └── YES → Material identified
               ↓
          Google Gemini 2.0 Flash → obterAnaliseSustentabilidade(material)
               ↓
          JSON with 6 environmental fields:
          • impacto_ambiental (environmental impact)
          • tempo_decomposicao (decomposition time)
          • onde_descartar (disposal instructions)
          • reciclabilidade (recyclability)
          • dicas_sustentaveis (sustainable tips)
          • beneficios_reciclagem (recycling benefits)
```

**Implementation details:**

- **Configurable threshold** via `AI_CONFIDENCE_THRESHOLD` (default: 70%)
- **Resilient fallback**: if Gemini fails or returns invalid JSON, a pre-defined analysis in `lib/ai/fallbacks/sustentabilidade.ts` is returned — UX doesn't break
- **Schema validation**: all 6 required fields are verified before accepting the AI response
- **AI Chat**: endpoint `/api/ia/chat` exposes free-form conversation with Gemini on environmental topics, with per-session message history

---

## 📡 API Routes

| Method          | Endpoint                   | Auth    | Cache | Description                            |
| --------------- | -------------------------- | ------- | ----- | -------------------------------------- |
| POST            | `/api/auth`                | —       | —     | Login (HttpOnly cookie)                |
| DELETE          | `/api/auth`                | —       | —     | Logout                                 |
| GET             | `/api/auth/me`             | ✅      | ✅    | Logged-in user data                    |
| POST            | `/api/auth/refresh`        | ✅      | —     | JWT token renewal                      |
| POST            | `/api/users`               | —       | —     | Public registration                    |
| GET             | `/api/produtos`            | —       | ✅    | Product listing (filters + pagination) |
| GET             | `/api/produtos/[id]`       | —       | ✅    | Product details                        |
| POST            | `/api/produtos`            | Admin   | —     | Create product                         |
| PUT             | `/api/produtos/[id]`       | Admin   | —     | Update product                         |
| DELETE          | `/api/produtos/[id]`       | Admin   | —     | Delete product                         |
| GET/POST/DELETE | `/api/produtos/[id]/fotos` | ✅      | ✅    | Manage photos                          |
| GET             | `/api/categorias`          | —       | ✅    | List categories                        |
| POST            | `/api/categorias`          | Admin   | —     | Create category                        |
| GET/PUT/DELETE  | `/api/categorias/[id]`     | —/Admin | ✅    | Category CRUD by id                    |
| GET             | `/api/marcas`              | —       | ✅    | List brands                            |
| POST            | `/api/marcas`              | Admin   | —     | Create brand                           |
| GET/PUT/DELETE  | `/api/marcas/[id]`         | —/Admin | ✅    | Brand CRUD by id                       |
| GET             | `/api/certificados`        | —       | ✅    | List certificates                      |
| POST            | `/api/certificados`        | Admin   | —     | Create certificate                     |
| GET/PUT/DELETE  | `/api/certificados/[id]`   | —/Admin | ✅    | Certificate CRUD by id                 |
| GET/POST        | `/api/usuarios`            | Admin   | ✅    | List / create users                    |
| GET/PUT/DELETE  | `/api/usuarios/[id]`       | Admin   | ✅    | Manage user by id                      |
| POST            | `/api/ia/scan`             | ✅      | —     | Material scanner                       |
| POST            | `/api/ia/chat`             | ✅      | —     | Sustainability chat                    |
| GET             | `/api/health`              | —       | —     | Application health check               |

---

## 🐳 Docker & Infrastructure

The project is fully containerized and ready to run anywhere with Docker.

### Services

| Service    | Image                     | Port | Details                           |
| ---------- | ------------------------- | ---- | --------------------------------- |
| `app`      | Local build (multi-stage) | 3000 | Next.js in production mode        |
| `postgres` | postgres:16-alpine        | 5432 | Primary database                  |
| `redis`    | redis:7-alpine            | 6379 | Cache and rate limiting           |
| `migrate`  | Local build (one-shot)    | —    | Runs migrations + seed on startup |

All services have **healthchecks** configured. The `app` waits for Postgres and Redis to be healthy before starting (`depends_on` with `condition: service_healthy`). The `migrate` service runs `prisma migrate deploy` + seed once and does not restart.

### Multi-stage Dockerfile

```dockerfile
# Stage 1: deps — install node_modules (Docker layer cache)
# Stage 2: builder — generate Prisma Client + Next.js build
# Stage 3: runner — minimal final image, non-root user
```

### Commands

```bash
# Start everything (app + db + cache + migrations + seed)
docker compose up --build

# In background
docker compose up --build -d

# Stop
docker compose down

# Full reset (delete volumes/database)
docker compose down -v
```

---

## ⚙️ CI/CD

Pipeline with **GitHub Actions** (`.github/workflows/ci.yml`), triggered on every push or PR to `main` and `develop`.

```
lint-and-build  →  docker  →  deploy
     ↑                ↑           ↑
  Every PR/push   Push only   main only
```

| Job              | Trigger        | What it does                                                                                          |
| ---------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `lint-and-build` | Push + PR      | Install deps, generate Prisma Client, `next lint`, `tsc --noEmit`, `next build`                       |
| `docker`         | Push           | Multi-stage build + push to GitHub Container Registry with `latest` and `sha-<commit>` tags           |
| `deploy`         | Push to `main` | SSH to server, pull new image, recreate app container without touching Postgres/Redis, run migrations |

### Required Secrets

| Secret            | Description                    |
| ----------------- | ------------------------------ |
| `SSH_HOST`        | Production server IP or domain |
| `SSH_USER`        | SSH username                   |
| `SSH_PRIVATE_KEY` | SSH private key (PEM format)   |

`GITHUB_TOKEN` for publishing to ghcr.io is provided automatically by GitHub Actions.

---

## 🚀 Running Locally

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (recommended)
- Google Gemini and Azure Custom Vision API keys (optional — scanner returns a friendly error without them)

### With Docker Compose (recommended)

```bash
# Clone the repository
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

# Configure environment variables
cp .env.example .env
# Edit .env: JWT_SECRET, GEMINI_KEY, AZURE_VISION_ENDPOINT, AZURE_VISION_KEY
# DATABASE_URL and REDIS_URL are overridden automatically by Compose

# Start everything (app + db + cache + migrations + seed)
docker compose up --build
```

Visit [http://localhost:3000](http://localhost:3000).

**Default seed credentials (development):**

| Role   | Email               | Password     |
| ------ | ------------------- | ------------ |
| Admin  | admin@ecoshop.com   | Admin@123456 |
| Client | cliente@ecoshop.com | Senha@123    |

### Without Docker (local Node.js)

```bash
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

npm install

cp .env.example .env.local
# Edit .env.local with your credentials

npx prisma migrate dev
npx prisma db seed

# Local Redis (optional via Docker)
docker run -d -p 6379:6379 redis:alpine

npm run dev
```

### Available Scripts

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `npm run dev`            | Development server                  |
| `npm run build`          | Production build                    |
| `npm run start`          | Production server                   |
| `npm run lint`           | Linter                              |
| `npm run typecheck`      | Type check without emitting files   |
| `npx prisma migrate dev` | Apply migrations + sync schema      |
| `npx prisma db seed`     | Populate database with initial data |
| `npx prisma studio`      | Visual database UI                  |

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecoshop"
REDIS_URL="redis://localhost:6379"

# JWT Authentication (minimum 32 characters)
JWT_SECRET="your-secret-key-here"

# Google Gemini
GEMINI_KEY="your-gemini-key"

# Azure Custom Vision
AZURE_VISION_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
AZURE_VISION_KEY="your-azure-key"

# AI confidence threshold (default: 0.7)
AI_CONFIDENCE_THRESHOLD=0.7

# Public URL (optional)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Admin seed (development only)
ADMIN_EMAIL="admin@ecoshop.com"
ADMIN_PASSWORD="Admin@123456"
ADMIN_NAME="EcoShop Administrator"
```

> **Graceful degradation:** Redis offline → app reads directly from database. Gemini/Azure offline → scanner returns a user-friendly message. Neither failure brings down the application.

---

## 📁 Folder Structure

```
ecoshop/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI/CD pipeline
├── app/
│   ├── (admin)/painel/             # Admin dashboard
│   ├── (auth)/sign-in/             # Login page
│   ├── (educacao)/educacao/        # Educational content
│   ├── (ia-scan)/ia-scan/          # AI material scanner
│   ├── (perfil)/perfil/            # User profile
│   ├── (sobre)/about/              # About the platform
│   ├── (store)/produtos/           # Product catalog
│   │   └── [id]/                   # Dynamic product page
│   ├── api/                        # Route Handlers (REST)
│   │   ├── auth/                   # Login, logout, me, refresh
│   │   ├── categorias/             # Category CRUD
│   │   ├── certificados/           # Certificate CRUD
│   │   ├── ia/                     # scan + chat
│   │   ├── marcas/                 # Brand CRUD
│   │   ├── produtos/               # Product CRUD + photos
│   │   ├── users/                  # Public registration
│   │   ├── usuarios/               # Admin management
│   │   └── health/                 # Health check
│   ├── _middleware/
│   │   └── auth.ts                 # Auth helpers for Route Handlers
│   ├── components/
│   │   └── Header.tsx              # Shared header
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Home
├── config/
│   └── rotas-protegidas.ts         # Access rules decoupled from middleware
├── lib/
│   ├── ai/
│   │   ├── analisar-imagem.ts      # Azure Custom Vision + Gemini
│   │   └── fallbacks/
│   │       └── sustentabilidade.ts # Fallback for AI offline
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCategorias.ts
│   │   ├── useCertificados.ts
│   │   ├── useFetch.ts             # In-memory cache + stale-while-revalidate
│   │   ├── useFotos.ts
│   │   ├── useIA.ts                # Scan and chat
│   │   ├── useMarcas.ts
│   │   ├── useMutation.ts          # Mutations + cache invalidation
│   │   └── useProdutos.ts
│   ├── http/
│   │   └── responses.ts            # Standardized HTTP response helpers
│   ├── schemas/                    # Zod schemas per entity
│   │   ├── categoria.ts
│   │   ├── certificado.ts
│   │   ├── ia-chat.ts
│   │   ├── marca.ts
│   │   ├── produto.ts
│   │   └── usuario.ts
│   ├── rate-limit.ts               # Redis-based rate limiting
│   └── redis.ts                    # Singleton + redisGet/redisSet/redisDel/delPattern
├── prints/                         # Interface screenshots
├── prisma/
│   ├── migrations/                 # Versioned migration history
│   ├── schema.prisma               # Data model
│   ├── seed.ts                     # Development seed data
│   └── seed-admin.ts               # Admin seed (configurable via .env)
├── public/
│   └── data_fotos/                 # Product photos (served statically)
├── services/                       # Business logic and database access
│   ├── categoria.service.ts
│   ├── certificado.service.ts
│   ├── foto.service.ts
│   ├── marca.service.ts
│   ├── produto.service.ts
│   └── usuario.service.ts
├── types/                          # TypeScript types for domain and API
│   ├── ai.ts
│   ├── api.ts
│   ├── auth.ts
│   └── domain.ts
├── .dockerignore
├── .env.example                    # Environment variable template
├── .gitignore
├── docker-compose.yml              # Orchestration (app + postgres + redis + migrate)
├── Dockerfile                      # Multi-stage build
├── middleware.ts                   # Edge Middleware — auth and authorization
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.seed.json              # Isolated tsconfig for Prisma seed
```

---

## 📄 License

Project built for portfolio purposes. Free to use as reference.
