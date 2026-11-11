# EcoShop — context for Claude

Showcase/catalog of sustainable products (no cart, order or payment). Next.js 15 (App Router), React 19, TypeScript strict, Prisma 7 + Postgres, Redis, jose (JWT), Zod, Azure Custom Vision + Gemini.

## Sources of truth (read before changing behavior)
- Project rules: `.specify/memory/constitution.md` (do not repeat them here).
- Current behavior per capability: `docs/capabilities/<cap>/spec.md` + `status.md`. Index: `docs/capabilities/README.md`.
- Decisions: `docs/architecture/adr/` (index in the README; pending ones in `pendentes.md`).
- System context: `docs/product/`, `docs/architecture/overview.md`.
- Changes in progress or past: `specs/NNN-*/` (Spec Kit; immutable after the merge).
- Code → capability map and sensitive paths → ADR: `sdd.config.json`.

## Language (ADR-0022)
- English is the single language: identifiers, files, comments, messages, tests and docs.
- Kept as they are (external contract or existing data): API route paths and JSON keys (`/api/produtos`, `nome`, `preco`, …), Prisma models/fields and DB names, enum values (`CLIENTE`, `MARCA`, `ADMIN`, `PENDENTE`, …), proper nouns, and capability codes/requirement IDs (`REQ-AUTZ-07`).
- UI copy is English for now; i18n comes later. Docs under `docs/` and `specs/` and the vocabulary read by `scripts/sdd/*` are still being migrated.

## Flow
1. Classify the track (full / fix / fix with a rule change / no behavior) — see `docs/guides/fluxo-sdd.md`.
2. Full track: `specs/NNN-*/{spec,plan,tasks}.md`, with the owner's approval at gates G1 (spec) and G2 (plan/ADR).
3. Test first, with the ID in the title: `test("REQ-XXX-NN: ...")`.
4. At the end: consolidate the capability's `spec.md`/`status.md`.

## Commands
`npm run lint` · `npx tsc --noEmit` · `npm run test:file -- tests/integration/<cap>.test.ts` (one file, short output) · `npm run test:quiet` (whole suite, short output) · `npm test` (as in CI; needs Postgres and Redis; see `docs/guides/rodar-e-testar.md`) · `npm run sdd:check` · `node scripts/sdd/impact-map.mjs --worktree`.

## Quick rules
- Do not invent facts or numbers; mark what you do not know as ❔ and ask.
- Preserve current behavior unless a change is approved in a spec.
- API handlers call `services/`, not `lib/db` directly; the access decision stays in the handler (ADR-0017).
- Write code, comments and docs in English. Do not edit the Constitution or an Accepted ADR without an explicit request from the owner.
- Do not read `docs/discovery/` unless asked (frozen snapshot). For large files, use Grep and Read with offset/limit.
