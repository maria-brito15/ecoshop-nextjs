# ADR-0022: English as the single language of code, comments, messages and documentation

- Status: Aceito
- Data: 2026-11-11
- Decisores: dono do projeto (choices "Keep the wire contract", "Add i18n later" and "Update the project rules", 2026-11-11) e Claude
- Origem: nova (substitui o ADR-0014)
- Capacidades: todas
- Substitui: ADR-0014

> Note: the metadata keys and the status vocabulary above (`Status`, `Aceito`, `Substitui`, …) are read by `scripts/sdd/*` and are still in Portuguese. Migrating that tooling vocabulary is listed in "Consequences".

## Context

ADR-0014 (inferred) ratified Portuguese for the domain: entities, functions, messages, comments and docs. The owner asked for a single language across the whole project, English, to make the code base consistent and open to contributors and tools that work in English. Part of the system, however, is a contract with the outside world and with data that already exists.

## Problem

Which language does each kind of artifact use, and what is deliberately left untouched so that nothing breaks?

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. English everywhere in the code base; keep the wire contract and the stored data as they are (chosen) | One language for code, comments, messages, tests and docs, with no breaking change | The wire contract and DB names stay Portuguese until a versioned change | — |
| B. English everywhere, including routes, JSON keys and DB names | Total consistency | Breaking API and schema migration | Existing clients and data |
| C. Keep ADR-0014 (Portuguese domain) | Nothing to do | Mixed languages persist | The request |

## Decision

Option A.

- **English:** identifiers (variables, functions, types, services, hooks, components, files and folders), comments and JSDoc, log lines, error and validation messages, UI copy, tests and test titles, constants, scripts, infrastructure files, READMEs and documentation.
- **Kept as they are (wire and data contract):** API route paths (`/api/produtos`, `/api/marcas`, `/api/usuarios`, `/api/ia/*`), page URLs (`/painel`, `/perfil`, `/educacao`, `/produtos`), JSON keys of requests and responses, Prisma models and fields, table and column names and applied migrations, enum values (`CLIENTE`, `MARCA`, `ADMIN`, `PENDENTE`, `APROVADA`, `REJEITADA`), the multipart field names, the field names of the AI prompt/response JSON, and proper nouns (institution, product and brand names).
- **Capability codes and requirement IDs** (`REQ-AUTZ-07`, `REQ-MIDIA-06`, …) are identifiers and are not renamed.
- **UI copy** is English for now; localization is a later, separate change (i18n).

## Justification

Consistency without breaking anything that is observable from outside. Changing routes, JSON keys or the schema would need versioning and a data migration, which the owner chose not to do now.

## Consequences

- Constitution Art. XIV.1 is amended accordingly; `CLAUDE.md` follows it.
- The wire contract can be renamed later through a new versioned ADR.
- A follow-up is needed to introduce i18n for the UI copy.
- Documentation under `docs/` and `specs/`, and the Portuguese vocabulary read by `scripts/sdd/*` (section titles, the EARS pattern, ADR metadata keys and statuses), are translated in a separate step, together with the validators.

## Verification

Review. `tsc`, ESLint and the DB-free tests pass after the rename; a text sweep finds no Portuguese left in code identifiers, comments or messages outside the preserved contract above.
