# ADR-0019: Delivery by image on GHCR with a versioned compose; migrations first, health check and rollback

- Status: Accepted
- Date: 2026-11-11
- Deciders: project owner (G1 of `specs/008-safe-operation/spec.md` and the technical autonomy granted on 2026-11-11) and Claude
- Origin: new (ratifies and details ADR-0013)
- Capabilities: OPS
- Supersedes: ADR-0013

## Context

ADR-0013 (Inferred) described the state of the code: an image on ghcr.io and a server over SSH. The audit of 2026-11-11 showed that this design was not reproducible from the repository: the deploy ran `docker compose pull app` with a compose that only had `build:`, started the new application **before** applying the migrations, did not check health nor know how to go back, depended on a compose on the server outside the repository and on a third-party action for SSH. The target serves HTTPS (owner's answer). The project is not in production yet.

## Problem

How do we publish the application reproducibly, without a window of new code with the old schema, and with an automatic return to the previous version if the new one does not become healthy?

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Versioned publishing compose + images on GHCR + versioned deploy script, via native ssh/scp (chosen) | Delivery that is reproducible and testable from the repository; order migrate → up → health → rollback; no third-party action | A new secret `SSH_KNOWN_HOSTS`; two images per commit (app and migrator); manual server operation remains | — |
| B. Keep the compose on the server outside the repository and the `appleboy/ssh-action` action | No change | Delivery neither reproducible nor testable; third-party code in the delivery chain | Any guarantee about the deploy order |
| C. PaaS (e.g. Vercel + managed Postgres) | Less operation | Redis and the photo filesystem to rethink (ADR-0011) | — |

## Decision

Option A.

- `docker-compose.prod.yml` (versioned) uses the GHCR images by commit tag (`sha-<7 characters>`); the migrations image is the Dockerfile's `migrator` target (`<tag>-migrator`), because the `runner` target does not have the Prisma CLI.
- `scripts/deploy/deploy.sh` runs on the server: pulls the images, applies the migrations (if they fail, the old application is not touched), starts the application, checks `GET /api/health` for up to 60 s and, if it fails, goes back to the previous tag and exits with an error.
- The CI deploy job uses native `scp` and `ssh` with strict host verification (`SSH_KNOWN_HOSTS`). The runtime secrets stay only in the server's `.env`.
- The rollback swaps only the image: it does **not undo migrations**. Rule: every migration is compatible with the previous version of the application (add before removing).
- TLS terminates at a reverse proxy outside the compose, pointing to `127.0.0.1:3000`; the application is not exposed directly.
- Production starts with an empty catalog; the ADMIN is created by a single explicit step (the `bootstrap` profile).

## Rationale

We accept one more secret and one more image in exchange for a verifiable delivery: the deploy order and the absence of a default secret are now checked by tests and by CI, not by discipline.

## Consequences

- The server needs `curl`, `docker compose` and the `.env` with the variables listed in the header of `docker-compose.prod.yml`.
- Automatic rollback covers an application failure, not a data one; an incompatible migration requires a notice in the PR (a checkbox in the template).
- Until spec 011, `/api/health` still returns 503 when only Redis goes down; in that case the deploy rolls back (the conservative side).
- Affects: `docker-compose.yml`, `docker-compose.override.yml`, `docker-compose.prod.yml`, `Dockerfile`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `scripts/deploy/deploy.sh`, `.github/pull_request_template.md`.

## Verification

`tests/integration/operations-config.test.ts` (script order, absence of `appleboy`, `SSH_KNOWN_HOSTS`, image without `build`, digests); the CI job validates the composes. The real rollback can only be rehearsed on a server: until then REQ-OPS-10 stays ◐ in `status.md`.
