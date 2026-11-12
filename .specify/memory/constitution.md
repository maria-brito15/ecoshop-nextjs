# EcoShop Constitution

**Version:** 1.0.0 · **Ratified:** 2026-11-10 (general authorization from Arthur; review at the end of Phase 4) · **Last amendment:** —

> **Non-negotiable** principles of the project. Instructions on "how to work" live in `CLAUDE.md`, `.claude/rules/` and the skills; decisions with alternatives live in `docs/architecture/adr/`; expected behavior lives in `docs/capabilities/`.
> Each article carries a **Why** (evidence in the project) and a **Verification** (CI, script or review). Vocabulary: **REQ** = requirement with an ID; **ADR** = architectural decision record.
> Provisional applicability: Articles XIII, XIV.2 and IX are **warnings** (they do not block CI) until the review at the end of Phase 4.

## Article I · The specification is the source of truth for behavior

1. Every behavior observable by the user or by an API client is described in a capability spec (`docs/capabilities/*/spec.md`) with identified requirements (`REQ-<CAP>-NN`).
2. A behavior change starts with the spec (tracks in `03-metodologia`, section 5). Code that diverges from the spec is a defect **or** an outdated spec; never "whatever".
3. The README and code comments are **not** a source of truth for behavior; they must point to the spec.

**Why:** the README today promises brand filtering, a photo gallery, user management in the UI and a chat; none of them exists as described.
**Verification:** `trace-check` (CI) + PR review.

## Article II · Specified behavior is tested behavior

1. Every requirement with status ✅ has at least one automated test whose name contains the ID (`REQ-CAT-03: …`).
2. A defect fix starts with a failing test.
3. Tests verify the spec, not the implementation: a test generated from the code must be reviewed against the requirement.
4. Pyramid for this project: **unit** for services, schemas and AI parsers; **integration** for Route Handlers with a real Postgres (container) and optional Redis; **E2E** only for critical journeys (login, catalog, dashboard, EcoScan with simulated AI).

**Why:** there are no tests today; the only barrier is `tsc`.
**Verification:** CI (tests + `trace-check` fails if a ✅ `REQ` has no test).

## Article III · Authorization denied by default, with a single source of truth

1. Every API route declares its access level (`publico`, `autenticado`, `proprio-recurso`, `admin`); a route without a declaration is treated as `admin` (deny by default).
2. The role × resource × action matrix is part of the spec (`docs/capabilities/authorization/spec.md`) and the implementation has **one** decision point (which one: ADR-P01, pending).
3. Endpoints that incur external cost (AI) require authentication and a usage limit.

**Why:** D1 (middleware contradicts handler) and D3 (public chat consuming quota).
**Verification:** an integration test that walks the matrix; PR review for new routes.

## Article IV · Sensitive data never leaves the server

1. API responses use an explicit projection (`select`) or a DTO; never the raw Prisma entity of `Usuario`.
2. Password hashes, tokens and API keys do not appear in responses, logs or logged URLs.

**Why:** D2 (`PUT /api/usuarios/[id]` returns the hash); Gemini key in a query string.
**Verification:** a contract test that searches for `senha` in user responses; review.

## Article V · Layers with a single responsibility

1. Route Handler: parsing, edge validation, authorization, mapping errors to HTTP. It does **not** access Prisma.
2. Service: business rules, persistence, cache and invalidation.
3. `lib/ai/providers` and `lib/redis` are infrastructure adapters; no business rules in them.
4. Pages implement no business rules or domain calculations (e.g. environmental impact).

**Why:** the convention already exists and works in 12 of the 17 handlers; the other 5 break it. Fixing it prevents further erosion.
**Verification:** an import rule in ESLint (`no-restricted-imports` of `@/lib/db` in `app/**`), CI.

## Article VI · Validation at the edge, derived types

1. Every external input (body, query, params, FormData, AI response) is validated by a Zod schema before use. This includes `page`/`size`.
2. Request/response types derive from the schemas (`z.infer`) or from a single DTO; hand-written parallel types are not allowed for contracts.

**Why:** D9 (unvalidated query); `preco: number` vs `Decimal` serialized as a string.
**Verification:** `tsc`; review.

## Article VII · Explicit errors and a single error contract

1. Services throw typed domain errors (e.g. `ResourceNotFound`, `BusinessConflict`, `OperationNotAllowed`); handlers map them to HTTP in a single table.
2. Deciding an error by `message.includes(...)` is forbidden.
3. Every error response follows `{ erro, codigo, detalhes? }`, documented in the API spec.
4. An infrastructure error never becomes a silent 500 when specified behavior exists (e.g. FK → 409).

**Why:** `includes("P2025")` and `throw new Error("P2025")`; D7.
**Verification:** integration tests of the error cases of each `REQ`.

## Article VIII · External dependencies degrade in a specified way

1. Each external dependency (Redis, Azure, Gemini) has, in the spec, the expected behavior when it is down, slow or returns garbage.
2. Every network call has a timeout and exception handling in the adapter.
3. A security fail-open (e.g. rate limit lifted without Redis) is allowed only with an ADR that accepts the risk.

**Why:** graceful degradation is a declared differentiator of the project, but Gemini without network takes the scan down (D4) and the rate limit lets everything through without Redis, with no recorded decision.
**Verification:** tests with the adapter simulating failure.

## Article IX · Cache consistency is a requirement, not a detail

1. Each cached resource declares its TTL and which mutations invalidate it (including mutations of **other** entities that it embeds).
2. The cache cannot be the only copy of anything.

**Why:** products embed the brand and category names, but changing a brand does not invalidate `produtos:*`.
**Verification:** an integration test "mutation X → read Y reflects it" for each row of the table.

## Article X · Data and schema are protected

1. Every schema change is a versioned, reviewed migration; migration `*.sql` files cannot be ignored by git.
2. Destructive scripts (that delete data) do not run automatically in any shared environment; seeds are idempotent.
3. There is a single `schema.prisma`.

**Why:** D5 (the seed deletes products on every `compose up`), `.gitignore:70`, duplicated `schema.txt`.
**Verification:** CI checks `prisma migrate diff` and the absence of schema copies; script review.

## Article XI · No invented data in the interface

1. A number shown to the user as fact (metrics, environmental impact, counts) has a source declared in the spec, or is computed from real data, or is labeled as illustrative.
2. AI-generated content is identified as such in the interface.

**Why:** "98% satisfaction", "2k+ products", CO₂ = price × 0.012.
**Verification:** human review (cannot be reliably automated).

## Article XII · Secrets and configuration

1. No secret has a default value usable outside local development; the application refuses to start in production without a strong `JWT_SECRET`.
2. Configuration is validated at startup by a single schema (env schema).
3. There is a single Node version for CI, Docker and development.

**Why:** default `JWT_SECRET` in Compose; Node 20 vs 22.
**Verification:** a startup test; CI.

## Article XIII · Proportional observability

1. 5xx errors and external-dependency failures are logged with context (route, dependency, duration), without sensitive data.
2. `/api/health` reflects the required dependencies; optional dependencies appear as "degraded", not as unavailable.

**Why:** today `/api/health` returns 503 when only Redis (optional by design) goes down, which can make Docker mark the app as unhealthy. Logs are loose `console.warn` calls.
**Applicability:** a portfolio project without an SLO; do not propose distributed tracing or APM.
**Verification:** review; the health test.

## Article XIV · Code and language conventions

1. **English** is the single language of the project: identifiers, files and folders, comments, messages (log, error, validation, interface), tests and documentation (ADR-0023). The wire and data contract is English too (ADR-0023): API paths and JSON keys, database models, fields, tables and enum values. Only proper nouns and the capability codes/requirement IDs keep their names. The glossary lives in `docs/product/glossary.md`.
2. A component/page does not exceed ~300 lines without justification; pages are composed of components per capability.
3. ESLint + Prettier are mandatory in CI.

**Why:** a single language keeps the code and the contract consistent and open to people who work in English; pages of 900–1,500 lines prevent testing and specifying in parts.
**Verification:** lint (CI); the size limit as a warning.

## Article XV · Use of AI agents

1. Agents work from an approved spec and a task list; they do not implement a feature without G1.
2. Agents do not edit the Constitution, accepted ADRs or capability specs outside the consolidation step; an accepted ADR changes only through a new ADR that supersedes it.
3. Agents do not mark a requirement ✅ without citing the test that passed.
4. Spec review is done in an isolated context (the `spec-reviewer` agent), not by the same context that wrote it.
5. Agents do not run destructive data commands (`migrate reset`, destructive `seed`, `docker compose down -v`) without an explicit request.
6. An unknown fact (e.g. the source of a metric) is marked as a question, never filled in.

**Why:** this is an AI-assisted engineering lab; the typical risk is the agent "resolving" ambiguity by making things up.
**Verification:** Claude Code hooks (blocks) + review.

## Article XVI · Code × specification consistency

1. Every PR declares: affected capabilities, `REQ`s touched, related ADRs, or "no behavior change".
2. A PR that changes behavior updates the capability spec in the same PR.
3. `trace-check` fails if: a `REQ` cited in a test does not exist; a ✅ `REQ` has no test; a spec cites a nonexistent or superseded ADR.

**Verification:** PR template + CI.

## Definition of Done (acceptance criterion for any change)

- [ ] Spec approved (G1) and plan/ADR approved (G2), according to the track
- [ ] Tests with the IDs of the affected `REQ`s, passing
- [ ] `lint`, `typecheck`, `test`, `build`, `trace-check` green
- [ ] Capability spec consolidated; status with evidence
- [ ] No violation of this Constitution, or a violation justified in the `plan.md` "Complexity Tracking"

## Governance of the Constitution

- Semantic version at the top (`1.0.0`). MAJOR: removes or inverts a principle. MINOR: new principle. PATCH: wording.
- An amendment only through a PR with a justification and the impact on existing artifacts.
- Review at each roadmap phase: a principle that was never used to decide anything is a candidate for removal.
