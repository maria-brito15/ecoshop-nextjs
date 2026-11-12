# Plan: 016-english-contract

Decision: ADR-0023 (English wire and data contract; migrations restarted from zero).

## Approach

1. **Mapping first.** One exact-token mapping (Portuguese identifier → English), applied mechanically with word boundaries over code, tests and living docs, then reviewed by hand. The compiler (`tsc` strict + regenerated Prisma client) catches every missed or colliding name in typed code; the test suite catches the rest of the wire contract.
2. **Files and folders** move with `git mv` (routes, pages, route groups) so history follows.
3. **Users merge** is the only structural change: one `app/api/users/` tree with per-method access decisions.
4. **Migrations:** delete the three folders, regenerate one `init` from the schema, verify on an empty database and with `migrate diff`.
5. **Docs last,** from the same mapping, excluding frozen material (`docs/discovery/`, `specs/001-015`, Accepted ADR bodies).

## Risks

- Strings that the compiler does not check: front-end `fetch` URLs and JSON keys in pages, the AI prompts and their response fields, SQL names in seeds, docker volume and directory names (`data_fotos`). Mitigation: text sweep for leftover Portuguese tokens, a boot check and tests.
- Collisions when a Portuguese name maps onto an existing English one (`erro` → `error`). Mitigation: `tsc` and lint.
- Front-end pages have no tests: the sweep and a manual run of the app cover them.
