# 🌿 EcoShop

> Plataforma de e-commerce sustentável com análise de materiais por IA, desenvolvida com Next.js 15, TypeScript, PostgreSQL e integração com Azure Vision + Google Gemini.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Segurança](#-autenticação-e-segurança)
- [Integração com IA](#-integração-com-ia)
- [Rotas da API](#-rotas-da-api)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas](#-estrutura-de-pastas)

---

## 🌱 Sobre o Projeto

O **EcoShop** é um e-commerce voltado para produtos sustentáveis que vai além da venda: oferece um scanner inteligente de materiais recicláveis via câmera, educação ambiental e um painel administrativo completo para gestão de produtos, marcas e usuários.

O projeto foi desenvolvido como uma aplicação full-stack com foco em boas práticas de engenharia de software, incluindo separação de responsabilidades, tipagem estrita com TypeScript, validação de dados com Zod e autenticação stateless com JWT.

---

## ✨ Funcionalidades

### Para Usuários

- 🛒 **Catálogo de Produtos** — listagem com filtros por categoria e marca, com paginação e busca
- 🔍 **Página de Produto** — detalhes completos, fotos, certificados de sustentabilidade e marca responsável
- 📸 **IA Scan** — scanner que identifica o material de um objeto por foto e retorna análise ambiental completa (tempo de decomposição, onde descartar, dicas sustentáveis)
- 🎓 **Seção Educação** — conteúdo educacional sobre consumo consciente e reciclagem
- 👤 **Perfil de Usuário** — gerenciamento de dados pessoais com controle de acesso por role

### Para Administradores

- 📊 **Painel Admin** — dashboard completo com gestão de produtos, categorias, marcas, certificados e usuários
- 🖼️ **Upload de Fotos** — gerenciamento de imagens de produtos diretamente pela interface

---

## 🛠 Stack Tecnológica

| Camada                               | Tecnologia                |
| ------------------------------------ | ------------------------- |
| **Framework**                        | Next.js 15 (App Router)   |
| **Linguagem**                        | TypeScript 5              |
| **Estilização**                      | Tailwind CSS 4            |
| **Banco de Dados**                   | PostgreSQL                |
| **ORM**                              | Prisma 7                  |
| **Autenticação**                     | JWT via `jose` + bcryptjs |
| **Validação**                        | Zod                       |
| **IA — Visão Computacional**         | Azure Custom Vision       |
| **IA — Análise de Sustentabilidade** | Google Gemini 2.0 Flash   |

---

## 🏗 Arquitetura

O projeto utiliza o **App Router do Next.js 15** com Route Groups para organizar as páginas por domínio, mantendo separação clara de contextos:

```
app/
├── (admin)/painel       → Área administrativa (role: ADMIN)
├── (auth)/sign-in       → Autenticação
├── (educacao)/educacao  → Conteúdo educacional
├── (ia-scan)/ia-scan    → Scanner de materiais (autenticado)
├── (perfil)/perfil      → Perfil do usuário (autenticado)
├── (sobre)/about        → Sobre a plataforma
├── (store)/produtos     → Catálogo e página de produto
├── api/                 → API Routes (REST)
└── page.tsx             → Home com scroll reveal e categorias dinâmicas
```

O **Middleware do Next.js** protege as rotas de forma centralizada, redirecionando usuários não autenticados para o login e bloqueando acesso de não-admins ao painel.

### Fluxo de Autenticação

```
Login → POST /api/auth → bcrypt.compare → signJWT → Cookie HttpOnly
     → Requisições subsequentes → Middleware → verifyToken → Payload
```

---

## 🗃 Banco de Dados

O schema foi modelado com Prisma e reflete as entidades do domínio de e-commerce sustentável:

```prisma
Usuario        → tipo: ADMIN | CLIENTE | MARCA
Marca          → 1:1 com Usuario (tipo MARCA)
Categoria      → 1:N com Produto
Certificado    → N:N com Produto (via ProdutoCertificado)
Produto        → pertence a Marca e Categoria, possui fotos e certificados
```

**Destaques do modelo:**

- Enum `TipoUsuario` para controle de roles diretamente no banco
- Relação N:N explícita entre `Produto` e `Certificado` (tabela de junção `produto_certificado`)
- Campo `fotoUrl` no produto com suporte a múltiplas fotos via endpoint dedicado
- Seed completo com dados iniciais para desenvolvimento (`prisma/seed.ts`)

---

## 🔐 Autenticação e Segurança

- **JWT stateless** com expiração de 7 dias, assinado com HS256 via biblioteca `jose`
- **Senhas criptografadas** com `bcryptjs`
- **Middleware centralizado** (`middleware.ts`) com três níveis de proteção:
  - Rotas públicas (sem restrição)
  - Rotas autenticadas (`/ia-scan`, `/perfil`)
  - Rotas admin (`/painel`, `/api/admin`)
- Respostas de API retornam `401 Unauthorized` ou `403 Forbidden` sem vazar detalhes internos
- Redirecionamento com `?next=` para retorno pós-login

---

## 🤖 Integração com IA

### Fluxo do Scanner (`/ia-scan`)

```
Foto do usuário
     ↓
Azure Custom Vision → classificarImagemAzure()
     ↓
Predição com confiança ≥ 70%?
  ├── NÃO → Retorna erro com sugestão de melhoria da foto
  └── SIM → material identificado
              ↓
         Google Gemini 2.0 Flash → obterAnaliseSustentabilidade()
              ↓
         JSON estruturado com 6 campos ambientais:
         • impacto_ambiental
         • tempo_decomposicao
         • onde_descartar
         • reciclabilidade
         • dicas_sustentaveis
         • beneficios_reciclagem
```

- **Fallback resiliente**: se o Gemini falhar ou retornar JSON inválido, uma análise básica pré-definida é retornada sem quebrar a experiência do usuário
- **Validação de schema**: todos os 6 campos obrigatórios são verificados antes de aceitar a resposta da IA
- **Threshold de confiança configurável** (`CONFIANCA_MINIMA = 0.7`)

---

## 📡 Rotas da API

| Método         | Endpoint                   | Auth      | Descrição                               |
| -------------- | -------------------------- | --------- | --------------------------------------- |
| POST           | `/api/auth`                | —         | Login                                   |
| GET            | `/api/auth/me`             | ✅        | Dados do usuário logado                 |
| POST           | `/api/auth/refresh`        | ✅        | Renovação de token                      |
| GET            | `/api/produtos`            | —         | Listagem de produtos                    |
| GET/PUT/DELETE | `/api/produtos/[id]`       | — / Admin | CRUD de produto                         |
| GET/POST       | `/api/produtos/[id]/fotos` | ✅        | Gerenciar fotos do produto              |
| GET/POST       | `/api/categorias`          | — / Admin | CRUD de categorias                      |
| GET/POST       | `/api/marcas`              | — / Admin | CRUD de marcas                          |
| GET/POST       | `/api/certificados`        | — / Admin | CRUD de certificados                    |
| GET/POST       | `/api/usuarios`            | Admin     | Gerenciar usuários                      |
| POST           | `/api/ia/scan`             | ✅        | Scanner de material por imagem          |
| POST           | `/api/ia/chat`             | ✅        | Chat com assistente de sustentabilidade |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente ou via Docker
- Chaves de API: Google Gemini e Azure Custom Vision (opcionais para funcionalidades de IA)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ecoshop.git
cd ecoshop

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas credenciais

# Rode as migrations e o seed
npx prisma migrate dev
npx prisma db seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🔑 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/ecoshop"

# JWT
JWT_SECRET="sua_chave_secreta_longa_e_aleatoria"

# Google Gemini
GEMINI_KEY="sua_chave_gemini"

# Azure Custom Vision
AZURE_VISION_ENDPOINT="https://sua-instancia.cognitiveservices.azure.com/..."
AZURE_VISION_KEY="sua_chave_azure"
```

> As funcionalidades de IA degradam graciosamente quando as chaves não estão configuradas — o restante da aplicação funciona normalmente.

---

## 📁 Estrutura de Pastas

```
ecoshop/
├── app/
│   ├── (admin)/painel/      # Dashboard administrativo
│   ├── (auth)/sign-in/      # Página de login
│   ├── (educacao)/educacao/ # Conteúdo educacional
│   ├── (ia-scan)/ia-scan/   # Scanner de materiais
│   ├── (perfil)/perfil/     # Perfil do usuário
│   ├── (sobre)/about/       # Sobre a plataforma
│   ├── (store)/produtos/    # Catálogo e produto
│   ├── api/                 # API Routes
│   ├── components/          # Componentes compartilhados (Header)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Home
├── lib/
│   ├── ai.ts                # Integração Azure + Gemini
│   ├── auth.ts              # JWT sign/verify
│   ├── db.ts                # Instância do Prisma Client
│   ├── api.ts               # Helpers de fetch
│   └── hooks/               # Custom hooks React
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
│   ├── schema.prisma        # Modelo de dados
│   ├── seed.ts              # Dados iniciais
│   └── migrations/
├── types/
│   └── api.ts               # Tipos TypeScript das respostas da API
├── middleware.ts             # Proteção de rotas
└── tailwind.config.ts
```

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de portfólio.
