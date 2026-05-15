# 🌿 EcoShop

> A sustainable e-commerce platform with AI-powered material analysis, built with Next.js 15, TypeScript, PostgreSQL, Redis, and integrated with Azure Custom Vision + Google Gemini.

[![CI/CD](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/ecoshop/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

🇧🇷 [Versão em Português](./README.md)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database](#-database)
- [Authentication & Security](#-authentication--security)
- [Redis Cache](#-redis-cache)
- [AI Integration](#-ai-integration)
- [API Routes](#-api-routes)
- [Docker & Infrastructure](#-docker--infrastructure)
- [CI/CD](#️-cicd)
- [Running Locally](#-running-locally)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)

---

## 🌱 About the Project

**EcoShop** is an e-commerce platform for sustainable products that goes beyond selling: it features an AI-powered recyclable material scanner via camera, environmental education content, and a complete admin dashboard for managing products, brands, categories, certificates, and users.

This project was built as a full-stack application with a strong focus on software engineering best practices, including:

- Separation of concerns using App Router Route Groups
- Strict typing with TypeScript 5
- Input validation with Zod
- Stateless authentication with JWT (via `jose` + `bcryptjs`)
- Two-layer caching with Redis on the server and in-memory `Map` on the client
- Graceful degradation for external services (Redis and AI)

---

## ✨ Features

### For Users

- 🛒 **Product Catalog** — browsable listings with category and brand filters, pagination, and search
- 🔍 **Product Page** — full details, photos, sustainability certificates, and responsible brand info
- 📸 **AI Scan** — camera-based scanner that identifies an object's material and returns a complete environmental analysis (decomposition time, disposal instructions, sustainable tips, and recycling benefits)
- 🎓 **Education Section** — curated content on conscious consumption and recycling
- 👤 **User Profile** — personal data management with role-based access control
- 💬 **Sustainability Chat** — AI assistant to answer questions about sustainable practices

### For Administrators

- 📊 **Admin Panel** — full dashboard for managing products, categories, brands, certificates, and users
- 🖼️ **Photo Upload** — product image management directly from the interface
- 👥 **User Management** — list, edit, and manage user roles (ADMIN, CLIENT, BRAND)

---

## 🛠 Tech Stack

| Layer                            | Technology                      |
| -------------------------------- | ------------------------------- |
| **Framework**                    | Next.js 15 (App Router)         |
| **Language**                     | TypeScript 5                    |
| **Styling**                      | Tailwind CSS 4                  |
| **Database**                     | PostgreSQL                      |
| **ORM**                          | Prisma 7 (`@prisma/adapter-pg`) |
| **Cache**                        | Redis 4 (`redis`)               |
| **Authentication**               | JWT via `jose` + `bcryptjs`     |
| **Validation**                   | Zod 3                           |
| **AI — Computer Vision**         | Azure Custom Vision             |
| **AI — Sustainability Analysis** | Google Gemini 2.0 Flash         |
| **Containerization**             | Docker + Docker Compose         |
| **CI/CD**                        | GitHub Actions + ghcr.io        |

---

## 🏗 Architecture

The project uses **Next.js 15's App Router** with Route Groups to organize pages by domain, maintaining clear context separation:

```
app/
├── (admin)/painel        → Admin area (role: ADMIN)
├── (auth)/sign-in        → Authentication
├── (educacao)/educacao   → Educational content
├── (ia-scan)/ia-scan     → Material scanner (authenticated)
├── (perfil)/perfil       → User profile (authenticated)
├── (sobre)/about         → About the platform
├── (store)/produtos      → Catalog and product pages
├── api/                  → API Routes (REST)
└── page.tsx              → Home with scroll reveal and dynamic categories
```

**Next.js Middleware** (`middleware.ts`) protects routes centrally with three access levels:

1. **Public routes** — no restriction
2. **Authenticated routes** — `/ia-scan`, `/perfil` — require a valid JWT token
3. **Admin routes** — `/painel`, `/api/admin`, `/api/usuarios` — require `tipo === "ADMIN"`

Unauthenticated users are redirected to `/sign-in?next=<original_route>`. APIs return `401` or `403` without leaking internal details.

### Authentication Flow

```
Login → POST /api/auth → bcrypt.compare(password, hash)
      → signJWT({ id, tipo }) → HttpOnly Cookie (7 days)
      → Subsequent requests → Middleware → verifyToken → payload
```

---

## 🗃 Database

The schema was modeled with Prisma 7 and reflects the entities of a sustainable e-commerce domain:

```prisma
Usuario (User)    → type: ADMIN | CLIENTE | MARCA
Marca (Brand)     → 1:1 with User (type MARCA)
Categoria         → 1:N with Produto
Certificado       → N:N with Produto (via ProdutoCertificado join table)
Produto (Product) → belongs to Brand and Category, has photos and certificates
```

**Highlights:**

- `TipoUsuario` enum (ADMIN, CLIENTE, MARCA) for role-based access control directly at the database level
- Explicit N:N relationship between `Produto` and `Certificado` via the `produto_certificado` join table
- `fotoUrl` field on the product with support for multiple photos via a dedicated endpoint (`/api/produtos/[id]/fotos`)
- Full seed file with initial development data (`prisma/seed.ts`), run with `npx prisma db seed`

---

## 🔐 Authentication & Security

- **Stateless JWT** with 7-day expiration, signed with HS256 using the `jose` library
- **Encrypted passwords** with `bcryptjs` (default salt rounds)
- **Centralized middleware** (`middleware.ts`) with a matcher configured to run only on the necessary routes, avoiding overhead on static assets
- API responses return `401 Unauthorized` (not authenticated) or `403 Forbidden` (no permission) without leaking internal details
- Post-login redirect support via `?next=` query param

```ts
// Protected routes configured in the matcher
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

## ⚡ Redis Cache

The project implements two-layer caching to reduce latency and lower the load on the database.

### Server layer — Redis (`lib/redis.ts` + `lib/cache.ts`)

All GET routes cache their responses in Redis with TTLs tuned by resource type:

| Resource                           | TTL   |
| ---------------------------------- | ----- |
| Categories, brands, certificates   | 5 min |
| Products (paginated listing)       | 2 min |
| Product, category, brand by id     | 3 min |
| User data and session              | 1 min |
| Product photo listing (filesystem) | 2 min |

Mutations (POST, PUT, DELETE) immediately invalidate affected cache entries after writing to the database:

- `invalidarCache("PRODUTOS")` — removes `produtos:*` (via non-blocking `SCAN` + `DEL`)
- `redisDel("produtos:42")` — removes a specific item by id

The Redis client is instantiated as a singleton on `globalThis` to survive Next.js hot-reloads. Connection errors are logged as `console.warn` without crashing the application — Redis is cache, not the primary data store.

### Client layer — memory (`lib/hooks/useFetch.ts`)

The `useFetch` hook maintains an in-memory `Map` with a 30-second TTL and implements the **stale-while-revalidate** strategy:

- Returns cached data instantly (no loading screen)
- Revalidates in the background after showing the cached response
- Updates React state only if the data actually changed

The `useMutation` hook invalidates client-side cache entries after each successful mutation, in sync with the Redis invalidation performed on the server.

### Full read flow

```
useFetch (client)
  → In-memory Map hit? → return immediately + revalidate in background
  → Map miss → fetch(url)
      → Route Handler → comCache(key, ttl, fetcher)
          → Redis hit? → return JSON
          → Redis miss → prisma.findMany() → redisSet(key, data, ttl) → return
```

---

## 🤖 AI Integration

### Scanner Flow (`/ia-scan`)

```
User photo (base64 or File)
       ↓
Azure Custom Vision → classifyImage()
       ↓
Prediction confidence ≥ 70%?
  ├── NO  → Returns error with photo improvement suggestion
  └── YES → Material identified
               ↓
          Google Gemini 2.0 Flash → getSustainabilityAnalysis(material)
               ↓
          Structured JSON with 6 environmental fields:
          • environmental_impact
          • decomposition_time
          • disposal_instructions
          • recyclability
          • sustainable_tips
          • recycling_benefits
```

**Implementation details (`lib/ai.ts`):**

- **Configurable confidence threshold** — `MIN_CONFIDENCE = 0.7` (70%)
- **Resilient fallback** — if Gemini fails or returns invalid JSON, a predefined basic analysis is returned without breaking the user experience
- **Schema validation** — all 6 required fields are verified before accepting the AI response
- **Sustainability chat** — the `/api/ia/chat` endpoint enables free conversation with Gemini on environmental topics

---

## 📡 API Routes

| Method          | Endpoint                   | Auth      | Cache | Description                               |
| --------------- | -------------------------- | --------- | ----- | ----------------------------------------- |
| POST            | `/api/auth`                | —         | —     | Login (sets HttpOnly cookie)              |
| DELETE          | `/api/auth`                | —         | —     | Logout (clears cookie)                    |
| GET             | `/api/auth/me`             | ✅        | ✅    | Logged-in user data                       |
| POST            | `/api/auth/refresh`        | ✅        | —     | JWT token renewal                         |
| POST            | `/api/users`               | —         | —     | Public user registration                  |
| GET             | `/api/produtos`            | —         | ✅    | Product listing (with filters/pagination) |
| GET             | `/api/produtos/[id]`       | —         | ✅    | Product details                           |
| PUT             | `/api/produtos/[id]`       | Admin     | —     | Update product (invalidates cache)        |
| DELETE          | `/api/produtos/[id]`       | Admin     | —     | Remove product (invalidates cache)        |
| GET/POST/DELETE | `/api/produtos/[id]/fotos` | ✅        | ✅    | Manage product photos                     |
| GET             | `/api/categorias`          | —         | ✅    | List categories                           |
| POST            | `/api/categorias`          | Admin     | —     | Create category (invalidates cache)       |
| GET/PUT/DELETE  | `/api/categorias/[id]`     | — / Admin | ✅    | Category CRUD by id                       |
| GET             | `/api/marcas`              | —         | ✅    | List brands                               |
| POST            | `/api/marcas`              | Admin     | —     | Create brand (invalidates cache)          |
| GET/PUT/DELETE  | `/api/marcas/[id]`         | — / Admin | ✅    | Brand CRUD by id                          |
| GET             | `/api/certificados`        | —         | ✅    | List certificates                         |
| POST            | `/api/certificados`        | Admin     | —     | Create certificate (invalidates cache)    |
| GET/PUT/DELETE  | `/api/certificados/[id]`   | — / Admin | ✅    | Certificate CRUD by id                    |
| GET/POST        | `/api/usuarios`            | Admin     | ✅    | List / create users                       |
| GET/PUT/DELETE  | `/api/usuarios/[id]`       | Admin     | ✅    | Manage user by id                         |
| POST            | `/api/ia/scan`             | ✅        | —     | Material scanner via image                |
| POST            | `/api/ia/chat`             | ✅        | —     | Chat with sustainability assistant        |

---

## 🐳 Docker & Infrastructure

The project is fully containerized with Docker and Docker Compose, covering all services needed to run in production.

### Services

| Service    | Image              | Port |
| ---------- | ------------------ | ---- |
| `app`      | Local build        | 3000 |
| `postgres` | postgres:16-alpine | 5432 |
| `redis`    | redis:7-alpine     | 6379 |
| `migrate`  | Local build (1×)   | —    |

The `migrate` service runs `prisma migrate deploy` + `prisma db seed` automatically on first startup and does not restart after that. All services have **healthchecks** configured — `app` only starts after Postgres and Redis are ready to accept connections.

### Commands

```bash
# build and start all services
docker compose up --build

# in background
docker compose up --build -d

# stop everything
docker compose down

# stop and remove volumes (full database reset)
docker compose down -v
```

### Multi-stage Dockerfile

```
deps     → installs dependencies (node_modules)
builder  → generates Prisma Client and runs the Next.js build
runner   → copies only what's needed, runs as a non-root user
```

---

## ⚙️ CI/CD

The pipeline is configured with **GitHub Actions** at `.github/workflows/ci.yml` and runs automatically on every push or PR to `main` and `develop`.

```
lint-and-build  →  docker  →  deploy
     ↑               ↑            ↑
  Every PR/push  Push only   main only
```

| Job              | Trigger        | What it does                                                                                              |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `lint-and-build` | Push + PR      | Installs deps, generates Prisma Client, runs lint, type-check, and build                                  |
| `docker`         | Push           | Builds multi-stage image and publishes to GitHub Container Registry with `latest` and `sha-<commit>` tags |
| `deploy`         | Push to `main` | SSH into the server, pulls the new image, recreates only the app container, runs pending migrations       |

### Required secrets (`Settings → Secrets → Actions`)

| Secret            | Description                  |
| ----------------- | ---------------------------- |
| `SSH_HOST`        | Server IP or domain          |
| `SSH_USER`        | SSH username                 |
| `SSH_PRIVATE_KEY` | SSH private key (PEM format) |

> The `GITHUB_TOKEN` used to publish to ghcr.io is provided automatically by GitHub — no configuration needed.

---

## 🚀 Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL running locally or via Docker
- Redis running locally or via Docker
- Google Gemini and Azure Custom Vision API keys (optional — required only for AI features)

### With Docker Compose (recommended)

```bash
# clone the repository
git clone https://github.com/your-username/ecoshop.git
cd ecoshop

# set up environment variables (api keys, jwt secret)
cp .env.example .env
# edit .env — DATABASE_URL and REDIS_URL are overridden by Compose automatically

# start everything (app + postgres + redis + migrations + seed)
docker compose up --build
```

Access [http://localhost:3000](http://localhost:3000).

### Without Docker (local Node.js)

```bash
# clone the repository
git clone https://github.com/your-username/ecoshop.git
cd ecoshop

# install dependencies
npm install

# set up environment variables
cp .env.example .env.local
# edit .env.local with your credentials

# run migrations and seed the database
npx prisma migrate dev
npx prisma db seed

# start Redis (if not installed locally)
docker run -d -p 6379:6379 redis:alpine

# start the development server
npm run dev
```

### Available Scripts

| Command                  | Description                             |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Start the development server            |
| `npm run build`          | Generate the production build           |
| `npm run start`          | Start the server in production mode     |
| `npm run lint`           | Run the linter                          |
| `npx prisma migrate dev` | Apply migrations and sync the schema    |
| `npx prisma db seed`     | Populate the database with initial data |
| `npx prisma studio`      | Open Prisma Studio (database UI)        |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in the variables:

```env
# Database
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

> **Graceful degradation:** AI features return a friendly error when Gemini/Azure keys are not configured — the rest of the application works normally. Redis also degrades gracefully: if offline, requests go directly to the database without affecting the application's behavior.

---

## 📁 Folder Structure

```
ecoshop/
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline (lint, build, docker, deploy)
├── app/
│   ├── (admin)/painel/        # Admin dashboard
│   ├── (auth)/sign-in/        # Login page
│   ├── (educacao)/educacao/   # Educational content
│   ├── (ia-scan)/ia-scan/     # AI material scanner
│   ├── (perfil)/perfil/       # User profile
│   ├── (sobre)/about/         # About page
│   ├── (store)/produtos/      # Catalog and product pages
│   │   └── [id]/              # Dynamic product page
│   ├── api/
│   │   ├── auth/              # Login, logout, me, refresh
│   │   ├── categorias/        # Categories CRUD
│   │   ├── certificados/      # Certificates CRUD
│   │   ├── ia/                # AI endpoints (scan, chat)
│   │   ├── marcas/            # Brands CRUD
│   │   ├── produtos/          # Products CRUD and photos
│   │   ├── users/             # Public registration
│   │   └── usuarios/          # User management (admin)
│   ├── components/
│   │   └── Header.tsx         # Shared header component
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Home
├── lib/
│   ├── ai.ts                  # Azure Custom Vision + Gemini integration
│   ├── api.ts                 # Client-side fetch helpers
│   ├── auth.ts                # JWT sign/verify
│   ├── cache.ts               # Cache helpers and invalidation (comCache, invalidarCache)
│   ├── db.ts                  # Prisma Client singleton instance
│   ├── redis.ts               # Redis singleton client (redisGet, redisSet, redisDel)
│   └── hooks/
│       ├── useAuth.ts         # Authentication hook
│       ├── useCategorias.ts
│       ├── useCertificados.ts
│       ├── useFetch.ts        # In-memory cache + stale-while-revalidate
│       ├── useFotos.ts        # Photo management
│       ├── useIA.ts           # AI hook (scan and chat)
│       ├── useMarcas.ts
│       ├── useMutation.ts     # Mutations with client cache invalidation
│       └── useProdutos.ts
├── prints/                    # Interface screenshots for documentation
├── prisma/
│   ├── migrations/            # Migration history
│   ├── schema.prisma          # Data model
│   └── seed.ts                # Initial development data
├── public/
│   └── data_fotos/            # Product photos (served statically)
├── types/
│   └── api.ts                 # TypeScript types for API responses
├── .dockerignore              # Files excluded from the Docker build context
├── .env.example               # Environment variables template
├── .gitignore
├── docker-compose.yml         # Local orchestration (app + postgres + redis + migrate)
├── Dockerfile                 # Multi-stage application build
├── middleware.ts              # Centralized route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.seed.json         # Isolated TypeScript config for the Prisma seed
```

---

## 📄 License

This project was developed for educational and portfolio purposes.
