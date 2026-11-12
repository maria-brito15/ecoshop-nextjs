# ADR-0023: English wire and data contract, with the migrations restarted from zero

- Status: Accepted
- Date: 2026-11-12
- Deciders: project owner (answers to the open questions of `specs/016-english-contract`, 2026-11-12) and Claude
- Origin: new (supersedes ADR-0022; makes one exception to ADR-0006)
- Capabilities: all
- Supersedes: ADR-0022

## Context

ADR-0022 made English the single language of the code base but kept the wire and data contract in Portuguese until a versioned change. The owner now asks for English everywhere, including the database. The project is not in production and no database with real data exists (owner decisions of 2026-11-11 and 2026-11-12), so no client or data has to survive.

## Problem

Keep English as the single language of the project (ADR-0022) and extend it to the whole contract (API paths, page URLs, JSON keys, Prisma models and fields, tables, columns, enum values, multipart and AI JSON fields) at the lowest cost, and decide what to do with the applied migrations.

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Rename everything and restart the migrations from a single English `init` (chosen) | Clean history in English, no legacy names in SQL | Every existing database must be recreated; breaks "never edit an applied migration" once | Any database with data that must survive (none exists) |
| B. Rename everything and add a rename migration on top | Keeps history | SQL full of `RENAME` statements, Portuguese names stay in the history | — |
| C. Keep ADR-0022 | Nothing to do | Mixed languages persist | The owner's request |

## Decision

Option A.

- **English everywhere (carried over from ADR-0022):** identifiers, files and folders, comments, log/error/validation messages, UI copy, tests and documentation. Localization remains a later, separate change (i18n).
- **Prisma, tables, columns, enums:** English names only (`User`, `Category`, `Brand`, `Certificate`, `Product`, `ProductCertificate`; `name`, `description`, `price`, `password`, `phone`, `type`, `createdAt`, `photoUrl`, `issuingBody`; enums `UserType` = `ADMIN | CUSTOMER | BRAND` and `BrandStatus` = `PENDING | APPROVED | REJECTED`). Tables and columns are plural/snake_case through `@@map`/`@map`.
- **Migrations:** the three existing migrations are replaced by one `init` generated from the new schema. This is the only exception to ADR-0006's rule "do not edit an applied migration" and is allowed because no database with data exists. From the next change on the rule applies again.
- **API paths and page URLs:** `/api/products` (`/photos`), `/api/brands` (`/approve`), `/api/categories`, `/api/certificates`, `/api/ai/chat`, `/api/ai/scan`; `/dashboard`, `/profile`, `/education`, `/ai-scan`, `/products`. No redirects from the old paths.
- **One users resource:** the public sign-up (`POST /api/users`) and the admin management (list, read, update, delete) live under `/api/users`, each method with its own access decision in the handler (ADR-0017); the old `/api/usuarios` disappears.
- **JSON keys, multipart fields and AI prompt/response fields** follow the same names (`name`, `price`, `error`, …).
- **AI contract:** the Gemini response and the scan result fields are English (`environmental_impact`, `decomposition_time`, `disposal_instructions`, `recyclability`, `sustainable_tips`, `recycling_benefits`, `success`, `suggestion`, …).
- **Unchanged:** proper nouns, capability codes and requirement IDs, the Azure Custom Vision material tags (`plastico`, `vidro`, `outros`, …: they are labels inside the trained model, renamed only by retraining it) and the legacy sample secrets that the JWT validator rejects. The demo seed content is translated, since it is sample data.

## Justification

The cheapest moment for a breaking rename is before the first deploy: there is nothing to migrate and nobody to notify. A single English `init` avoids carrying Portuguese names in the migration history.

## Consequences

- Constitution Art. XIV.1 and `CLAUDE.md` are amended to remove the "kept as they are" list.
- Anything built against the old names (bookmarks, scripts, any local database) breaks. Local databases are recreated with `prisma migrate reset`.
- Living specs, guides and `sdd.config.json` cite the new names; change specs 001-015 and Accepted ADRs keep their historical text.
- After this change a contract rename is again a versioned change with its own ADR.

## Verification

`tsc`, ESLint, `npm test` against a database built from the single `init`, `prisma migrate diff` showing no drift, `npm run build`, `npm run sdd:check`, and a text sweep that finds no Portuguese names outside historical documents.
