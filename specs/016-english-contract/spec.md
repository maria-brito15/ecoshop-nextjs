# Change spec: 016-english-contract

- **Track:** full (breaking change to the wire and data contract)
- **Affected capabilities:** all (AUTZ, AUTH, PERF, CAT, PROD, REF, MIDIA, USR, SCAN, CHAT, CONT, OPS)
- **Status:** Implemented on 2026-11-12 (owner answers to the open questions on 2026-11-12); consolidated in the living specs and ADR-0023
- **Author / approver:** Claude / project owner · **Date:** 2026-11-12
- **Supersedes:** ADR-0022, through ADR-0023.

## Problem

ADR-0022 made English the single language of the code base but deliberately kept the wire contract and the stored data in Portuguese (API paths, JSON keys, page URLs, Prisma models and fields, table/column names, enum values, multipart and AI JSON field names). The owner now wants the whole project in English, including the database, and starting the migrations from zero.

## Why now

The project is not in production (owner decision, 2026-11-11), so there is no data to migrate and no external client to keep working. This is the cheapest moment for a breaking rename.

## Proposed rename map (to approve)

### Prisma, tables, columns, enums

| Today | Proposed |
|---|---|
| `Usuario` / `usuarios` | `User` / `users` |
| `Categoria` / `categorias` | `Category` / `categories` |
| `Marca` / `marcas` | `Brand` / `brands` |
| `Certificado` / `certificados` | `Certificate` / `certificates` |
| `Produto` / `produtos` | `Product` / `products` |
| `ProdutoCertificado` / `produto_certificado` | `ProductCertificate` / `product_certificates` |
| `nome` · `descricao` · `preco` · `senha` · `telefone` · `tipo` | `name` · `description` · `price` · `password` · `phone` · `type` |
| `criadoEm` (`criado_em`) · `fotoUrl` (`foto_url`) · `orgaoEmissor` (`orgao_emissor`) | `createdAt` (`created_at`) · `photoUrl` (`photo_url`) · `issuingBody` (`issuing_body`) |
| `usuarioId` · `categoriaId` · `marcaId` · `produtoId` · `certificadoId` (+ `_id` columns) | `userId` · `categoryId` · `brandId` · `productId` · `certificateId` (+ `_id` columns) |
| enum `TipoUsuario` `ADMIN` `CLIENTE` `MARCA` | `UserType` `ADMIN` `CUSTOMER` `BRAND` |
| enum `StatusMarca` `PENDENTE` `APROVADA` `REJEITADA` | `BrandStatus` `PENDING` `APPROVED` `REJECTED` |

### API paths

| Today | Proposed |
|---|---|
| `/api/produtos`, `/api/produtos/[id]`, `/api/produtos/[id]/fotos` | `/api/products`, `/api/products/[id]`, `/api/products/[id]/photos` |
| `/api/marcas`, `/api/marcas/[id]`, `/api/marcas/[id]/aprovar` | `/api/brands`, `/api/brands/[id]`, `/api/brands/[id]/approve` |
| `/api/categorias`, `/api/certificados` (+ `[id]`) | `/api/categories`, `/api/certificates` (+ `[id]`) |
| `/api/usuarios`, `/api/usuarios/[id]` (admin) and `/api/users` (public sign-up) | see open question 2 |
| `/api/ia/chat`, `/api/ia/scan` | `/api/ai/chat`, `/api/ai/scan` |
| `/api/auth/*`, `/api/health` | unchanged (already English) |

### Page URLs

`/painel` → `/dashboard`, `/perfil` → `/profile`, `/educacao` → `/education`, `/ia-scan` → `/ai-scan`, `/produtos` → `/products`. `/sign-in` and `/about` are unchanged; the `(sobre)` route group becomes `(about)`.

### JSON keys, multipart fields, AI prompt/response fields

Every Portuguese key follows the field map above (`nome` → `name`, `preco` → `price`, `tipo` → `type`, error key `erro` → `error`, …). The exhaustive list is produced in the plan (T1) by scanning the Zod schemas, the handlers and `types/`.

## Out of scope

- Proper nouns in data (product, brand, institution names) and the seed's sample content language (see open question 5).
- Introducing i18n for the UI copy (already English; localization stays a later change).
- Any behavior change: same rules, same status codes, same validations. Only names change.

## Requirements (draft IDs; final numbering at plan time)

- **REQ-OPS-21** (consolidated in `docs/capabilities/operations/spec.md`): The Prisma schema, the database (tables, columns, enums) and every migration use English names only; a fresh database built from the migrations matches the schema (no drift).
- **REQ-OPS-22:** API paths, page URLs, JSON keys, multipart fields and the AI prompt/response fields use English names only; no Portuguese name remains in `app/`, `lib/`, `services/`, `types/`, `components/`, `hooks/` outside proper nouns and data.
- **REQ-OPS-23:** All existing behavior is preserved: the whole test suite passes after the rename, with test titles and IDs unchanged.
- **REQ-OPS-24:** Documentation (living specs, ADRs, change specs, guides, `sdd.config.json`, `.claude`, `.github`) cites the new names; `npm run sdd:check` passes.

## Recorded decision

A new ADR (to be written at G2) supersedes the "kept as they are" part of ADR-0022 and ADR-0006's migration policy for this one exception (see open question 3). The Constitution Art. XIV.1 and `CLAUDE.md` need the matching amendment, which the owner must approve explicitly.

## Verification

`tsc`, lint, `npm test` against the local Docker database, `npm run sdd:check`, `npm run build`, `prisma migrate reset` from zero followed by `prisma migrate diff` showing no drift, and a text sweep for leftover Portuguese names.

## Resolved questions (owner answers, 2026-11-12)

1. Approved as proposed. **Rename map:** is the table above right? In particular `CLIENTE` → `CUSTOMER` (vs `CLIENT`), `MARCA` → `BRAND`, `painel` → `dashboard` (vs `admin-panel`), `ia-scan` → `ai-scan` (vs `ecoscan`, the capability's name).
2. One route: `/api/users`; POST is administrative for an ADMIN session and public registration for anyone else. **`/api/users` vs `/api/usuarios`:** today there are two routes for the same resource (public sign-up on `users`, admin management on `usuarios`). Merge into one `/api/users` (POST public, GET/PUT/DELETE admin-guarded), or keep two paths (for example `/api/users` and `/api/admin/users`)? Merging is a small structural change, not only a rename.
3. Single English `init`; no database with data exists. **Migrations:** replace the 3 existing migrations with a single English `init` (needs `prisma migrate reset` on every existing database, including any deployed one) or add a rename migration on top (keeps history, more SQL)? This only works for option "reset" if no database with data must survive. Confirm that none does.
4. Approved. **Branch and commits:** one branch (`feat/english-contract`) with one commit per task, merged once everything is green?
5. Translate. **Seed content:** the demo seed holds Portuguese product and category names. Translate them to English (it is sample data, not proper nouns) or keep them?
6. Agreed. **Old URLs:** no redirects from the Portuguese paths, since nothing is public yet. Agreed?
