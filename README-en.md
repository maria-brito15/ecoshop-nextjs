# 🌿 EcoShop

> A sustainable e-commerce platform with AI-powered material analysis, built with Next.js 15, TypeScript, PostgreSQL, and integrated with Azure Vision + Google Gemini.

🇧🇷 [Versão em Português](./README-pt.md) · 🖼️ [View Interface Screenshots](./INTERFACE.md)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database](#-database)
- [Authentication & Security](#-authentication--security)
- [AI Integration](#-ai-integration)
- [API Routes](#-api-routes)
- [Running Locally](#-running-locally)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)

---

## 🌱 About the Project

**EcoShop** is an e-commerce platform for sustainable products that goes beyond selling: it features an AI-powered recyclable material scanner via camera, environmental education content, and a complete admin dashboard for managing products, brands, and users.

This project was built as a full-stack application with a strong focus on software engineering best practices — including separation of concerns, strict typing with TypeScript, data validation with Zod, and stateless authentication with JWT.

---

## ✨ Features

### For Users

- 🛒 **Product Catalog** — browsable listings with category and brand filters, pagination, and search
- 🔍 **Product Page** — full details, photos, sustainability certificates, and responsible brand info
- 📸 **AI Scan** — camera-based scanner that identifies an object's material and returns a complete environmental analysis (decomposition time, how to dispose of it, sustainable tips)
- 🎓 **Education Section** — curated content on conscious consumption and recycling
- 👤 **User Profile** — personal data management with role-based access control

### For Administrators

- 📊 **Admin Panel** — full dashboard for managing products, categories, brands, certificates, and users
- 🖼️ **Photo Upload** — product image management directly from the interface

---

## 🛠 Tech Stack

| Layer                            | Technology                |
| -------------------------------- | ------------------------- |
| **Framework**                    | Next.js 15 (App Router)   |
| **Language**                     | TypeScript 5              |
| **Styling**                      | Tailwind CSS 4            |
| **Database**                     | PostgreSQL                |
| **ORM**                          | Prisma 7                  |
| **Authentication**               | JWT via `jose` + bcryptjs |
| **Validation**                   | Zod                       |
| **AI — Computer Vision**         | Azure Custom Vision       |
| **AI — Sustainability Analysis** | Google Gemini 2.0 Flash   |

---

## 🏗 Architecture

The project uses **Next.js 15's App Router** with Route Groups to organize pages by domain, maintaining clear context separation:

```
app/
├── (admin)/painel       → Admin area (role: ADMIN)
├── (auth)/sign-in       → Authentication
├── (educacao)/educacao  → Educational content
├── (ia-scan)/ia-scan    → Material scanner (authenticated)
├── (perfil)/perfil      → User profile (authenticated)
├── (sobre)/about        → About the platform
├── (store)/produtos     → Catalog and product pages
├── api/                 → API Routes (REST)
└── page.tsx             → Home with scroll reveal and dynamic categories
```

**Next.js Middleware** protects routes centrally, redirecting unauthenticated users to the login page and blocking non-admins from the admin panel.

### Authentication Flow

```
Login → POST /api/auth → bcrypt.compare → signJWT → HttpOnly Cookie
     → Subsequent requests → Middleware → verifyToken → Payload
```

---

## 🗃 Database

The schema was modeled with Prisma and reflects the entities of a sustainable e-commerce domain:

```prisma
User           → type: ADMIN | CLIENT | BRAND
Brand          → 1:1 with User (type BRAND)
Category       → 1:N with Product
Certificate    → N:N with Product (via ProductCertificate join table)
Product        → belongs to Brand and Category, has photos and certificates
```

**Highlights:**

- `UserType` enum for role-based access control directly at the database level
- Explicit N:N relationship between `Product` and `Certificate` (via `product_certificate` join table)
- `photoUrl` field on the product with support for multiple photos via a dedicated endpoint
- Full seed file with initial development data (`prisma/seed.ts`)

---

## 🔐 Authentication & Security

- **Stateless JWT** with 7-day expiration, signed with HS256 using the `jose` library
- **Encrypted passwords** with `bcryptjs`
- **Centralized middleware** (`middleware.ts`) with three protection levels:
  - Public routes (no restriction)
  - Authenticated routes (`/ia-scan`, `/perfil`)
  - Admin routes (`/painel`, `/api/admin`)
- API responses return `401 Unauthorized` or `403 Forbidden` without leaking internal details
- Post-login redirect support via `?next=` query param

---

## 🤖 AI Integration

### Scanner Flow (`/ia-scan`)

```
User photo
     ↓
Azure Custom Vision → classifyImageAzure()
     ↓
Prediction confidence ≥ 70%?
  ├── NO  → Returns error with photo improvement suggestion
  └── YES → Material identified
              ↓
         Google Gemini 2.0 Flash → getSustainabilityAnalysis()
              ↓
         Structured JSON with 6 environmental fields:
         • environmental_impact
         • decomposition_time
         • disposal_instructions
         • recyclability
         • sustainable_tips
         • recycling_benefits
```

- **Resilient fallback**: if Gemini fails or returns invalid JSON, a predefined basic analysis is returned without breaking the user experience
- **Schema validation**: all 6 required fields are verified before accepting the AI response
- **Configurable confidence threshold** (`MIN_CONFIDENCE = 0.7`)

---

## 📡 API Routes

| Method         | Endpoint                   | Auth      | Description                        |
| -------------- | -------------------------- | --------- | ---------------------------------- |
| POST           | `/api/auth`                | —         | Login                              |
| GET            | `/api/auth/me`             | ✅        | Logged-in user data                |
| POST           | `/api/auth/refresh`        | ✅        | Token renewal                      |
| GET            | `/api/produtos`            | —         | Product listing                    |
| GET/PUT/DELETE | `/api/produtos/[id]`       | — / Admin | Product CRUD                       |
| GET/POST       | `/api/produtos/[id]/fotos` | ✅        | Manage product photos              |
| GET/POST       | `/api/categorias`          | — / Admin | Category CRUD                      |
| GET/POST       | `/api/marcas`              | — / Admin | Brand CRUD                         |
| GET/POST       | `/api/certificados`        | — / Admin | Certificate CRUD                   |
| GET/POST       | `/api/usuarios`            | Admin     | User management                    |
| POST           | `/api/ia/scan`             | ✅        | Material scanner via image         |
| POST           | `/api/ia/chat`             | ✅        | Chat with sustainability assistant |

---

## 🚀 Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL running locally or via Docker
- API keys: Google Gemini and Azure Custom Vision (optional — required only for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ecoshop.git
cd ecoshop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run migrations and seed the database
npx prisma migrate dev
npx prisma db seed

# Start the development server
npm run dev
```

Access [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecoshop"

# JWT
JWT_SECRET="your_long_random_secret_key"

# Google Gemini
GEMINI_KEY="your_gemini_api_key"

# Azure Custom Vision
AZURE_VISION_ENDPOINT="https://your-instance.cognitiveservices.azure.com/..."
AZURE_VISION_KEY="your_azure_api_key"
```

> AI features degrade gracefully when API keys are not configured — the rest of the application works normally.

---

## 📁 Folder Structure

```
ecoshop/
├── app/
│   ├── (admin)/painel/      # Admin dashboard
│   ├── (auth)/sign-in/      # Login page
│   ├── (educacao)/educacao/ # Educational content
│   ├── (ia-scan)/ia-scan/   # Material scanner
│   ├── (perfil)/perfil/     # User profile
│   ├── (sobre)/about/       # About page
│   ├── (store)/produtos/    # Catalog and product pages
│   ├── api/                 # API Routes
│   ├── components/          # Shared components (Header)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Home
├── lib/
│   ├── ai.ts                # Azure + Gemini integration
│   ├── auth.ts              # JWT sign/verify
│   ├── db.ts                # Prisma Client instance
│   ├── api.ts               # Fetch helpers
│   └── hooks/               # Custom React hooks
│       ├── useAuth.ts
│       ├── useProdutos.ts
│       ├── useCategorias.ts
│       ├── useMarcas.ts
│       ├── useCertificados.ts
│       ├── useIA.ts
│       ├── useFotos.ts
│       ├── useFetch.ts
│       └── useMutation.ts
├── prisma/
│   ├── schema.prisma        # Data model
│   ├── seed.ts              # Seed data
│   └── migrations/
├── types/
│   └── api.ts               # TypeScript types for API responses
├── middleware.ts             # Route protection
└── tailwind.config.ts
```

---

## 📄 License

This project was developed for educational and portfolio purposes.
