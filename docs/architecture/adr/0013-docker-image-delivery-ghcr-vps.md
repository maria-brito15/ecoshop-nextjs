# ADR-0013: Delivery by Docker image on ghcr.io and a VPS via SSH with Compose

- Status: Superseded
- Superseded by: ADR-0019
- Date: unknown (no git history in the analyzed package)
- Deciders: unknown (historical decision)
- Origin: inferred from the code
- Capabilities: OPS

> **Inferred decision:** the code shows this state; there is no proof that it was a formal choice. The alternatives were reconstructed. It can be ratified (a new Accepted ADR) or superseded.

## Context
Evidence: `.github/workflows/ci.yml` (docker → deploy), `docker-compose.yml`, `migrate` service. The project is not in production yet.

## Problem
How do we publish the application?

## Alternatives
| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Docker + VPS over SSH (current) | Full control | Manual server operation | — |
| B. PaaS (e.g. Vercel + managed Postgres) | Less operation | Redis and filesystem to rethink | — |

## Decision
Keep A as historical; ratify when there is production.

## Rationale
Inferred.

## Consequences
Destructive seed on `compose up` (D5). Affects: Dockerfile, Compose, workflow.

## Verification
—
