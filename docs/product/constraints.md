# System constraints

| Constraint | Origin | Type |
|---|---|---|
| Next.js 15 (App Router), React 19, strict TypeScript | `package.json` | Current choice (ADR-0003) — can be revised by an ADR |
| PostgreSQL 16 + Prisma 7 | ADR-0006 | Current choice |
| Redis is optional | ADR-0010 | Current choice |
| Node 22 (Docker, CI and `.nvmrc`) | Dockerfile | Standardized in ADR-0015/CI |
| English as the single language of code, messages and documentation; UI copy in English for now (i18n later) | ADR-0023 (supersedes ADR-0022 and ADR-0014) | Choice |
| Hosting on a VPS with Docker Compose | ADR-0013 | Choice (no production yet) |
| Dependence on paid third parties: Azure Custom Vision and Gemini | `lib/ai` | **Real constraint**: cost and availability outside our control |
| Project maintained by one person, for portfolio and learning purposes | owner | Context: processes must be proportional |
