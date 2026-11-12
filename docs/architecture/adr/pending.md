# Pending architectural decisions

These are **not ADRs yet**: they still lack a decision and data. Each one becomes an ADR (next free number) when a change spec needs it. Alternatives and an initial recommendation in `docs/discovery/2026-11-baseline/06-inventario-adrs.md`.

| Code | Decision | Depends on | When to decide |
|---|---|---|---|
| P02 | Session policy (revocation, duration) — supersedes ADR-0007 if it changes | There is no production yet: a good time | Before the first deploy |
| P04 | Rate limit without Redis (fail-open/closed/memory) | — | Before the first deploy |
| P05 | Cache consistency strategy | Measurement of real need | Catalog spec |
| P06 | Scope of the Azure model (Custom Vision tags) — the "chat with UI" part was resolved on 2026-11-10 (`specs/004-floating-chat/spec.md`: floating button) | Azure tags documented | EcoScan spec, if it changes |
| P07 | Data fetching in the UI (hooks × Server Components × library) | Decomposition of the pages | When the pages are componentized |
| P09 | API contract (table in the spec × OpenAPI) | An external consumer appearing | On demand |

Resolved: P03 (media storage) was ratified on 2026-11-10 as ADR-0011 Accepted — keeps the local filesystem. P11 (MARCA sign-up approval) was ratified on 2026-11-10 as ADR-0018 Accepted — the status lives on `Marca`.

## Features decided, not yet built

These are not architecture decisions (that is why they are not in the table above); they are the owner's answers (`docs/discovery/2026-11-baseline/11-respostas-e-correcoes-iniciais.md`). The 2026-11-10 backlog was fully implemented on 2026-11-11 (MARCA approval — ADR-0018; floating chat; photo gallery; catalog filter/sort; product↔certificate link; history and impact metrics). No pending item at the moment.
