# Tasks: 008-operacao-segura

- **Status:** T1–T8 implemented on 2026-11-11, **without commits** (the owner did not ask for them). T0 was not done (commit of the earlier work); the whole suite **was not run**: no test database was available and the Docker daemon was stopped. Result per task in `docs/capabilities/operacao/status.md`.
- **Rule:** in each task the test comes first and fails; then the code; one commit per task. The test `[ID]` is the title `test("REQ-OPS-NN: …")`.

| # | Task | REQ | Done when |
|---|---|---|---|
| T0 | Commit the work in progress (specs 002–007) and run the whole suite to record the baseline | — | clean `git status` and the suite result noted in `status.md` |
| T1 | `validateJwtSecret` + `instrumentation.ts`; `.env.example` with an empty `JWT_SECRET`; a CI step that starts the built server with an invalid secret and expects an error | REQ-OPS-06 | unit tests (missing, short, example value, valid; production only) pass; the CI step confirms that Next aborts the start ❔ |
| T2 | Seeds without an embedded password, with a shared 12+ character validation; adjust the REQ-OPS-02/03 tests | REQ-OPS-09 | seed and seed-admin without the variable exit with an error before writing; with it, current behavior; REQ-OPS-03 keeps passing |
| T3 | Base `docker-compose.yml` and `docker-compose.override.yml`; update `.env.example` and the README | REQ-OPS-07, REQ-OPS-08 | static test: no `:-` on a secret, no `5432`/`6379` in the base, the override publishes on `127.0.0.1`; the CI step `docker compose config` fails without the variables and passes with them |
| T4 | `docker-compose.prod.yml`; the CI `docker` job also publishes the `migrator` image and exposes the tag | REQ-OPS-11 | `docker compose -f docker-compose.prod.yml config` valid; static test: no `build`, no `seed.ts`, port only on `127.0.0.1` |
| T5 | `scripts/deploy/deploy.sh`, `deploy` job with native `ssh`/`scp` and `SSH_KNOWN_HOSTS`; document the compatible-migrations rule; a box in `pull_request_template.md` | REQ-OPS-10 | static test of the order (migrate → up → health → rollback, `set -eu`); a local rehearsal with an image that fails health recorded as `manual:`; REQ-OPS-10 stays ◐ until there is a rehearsal on the server |
| T6 | Headers in `next.config.ts` | REQ-OPS-12 | the test reads `headers()`; HSTS only with `NODE_ENV=production` |
| T7 | Digests on the images and `.github/dependabot.yml` | REQ-OPS-13 | no image without a digest (static test); dependabot covers docker, docker-compose and github-actions; **stops and asks if there is no Docker/network to obtain the digests** |
| T8 | ADR-0019 (supersedes 0013), amendment of REQ-OPS-02/05 and new REQ-OPS-06..13 in `operacao/spec.md` and `status.md`, README, `sdd.config.json` if needed | all | `npm run sdd:check`, lint, `tsc` and the suite green; `impact-map --worktree` lists only OPS; drift-auditor with no pending item |

## Order and dependencies

T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T6 and T7 do not depend on the earlier ones and can be done at any point after T0. T4 depends on T3 (same variable design). T5 depends on T4.
