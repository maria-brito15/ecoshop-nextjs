# ADR-0020: Optional Redis with fast failure, in-memory rate limit without Redis and "degraded" health

- Status: Accepted
- Date: 2026-11-11
- Deciders: project owner ("local memory" decision of 2026-11-11 for the rate limit without Redis) and Claude
- Origin: new (ratifies and corrects ADR-0010)
- Capabilities: OPS, AUTH
- Supersedes: ADR-0010

## Context

ADR-0010 (Inferred) described the state of the code: Redis is optional and everything "lets through" when it fails, including the rate limit. The audit of 2026-11-11 found four problems in that design:

- node-redis queues commands while it is disconnected and has no timeout: with Redis down, requests could hang instead of "degrading".
- The rate limit let everything through without Redis (a fail-open with no recorded decision; Constitution Art. VIII.3) and used separate `INCR` and `EXPIRE`, which left the key without an expiry if the process died between the two.
- The client IP came from the first value of `x-forwarded-for`, which the client itself writes.
- `/api/health` returned 503 when only Redis went down, contradicting Art. XIII.2 and taking down the deploy and the healthcheck.

The owner decided (2026-11-11) that, without Redis, the rate limit uses local memory. The project runs with one instance (owner's answer).

## Problem

How do we keep Redis optional without hanging requests, without giving up the rate limit and without reporting "unavailable" when only an optional dependency goes down?

## Alternatives

| Option | Solves | Costs | Blocks |
|---|---|---|---|
| A. Fast failure + in-memory rate limit + "degraded" health (chosen) | Redis down neither hangs nor lifts the limit; correct health | Limit per instance and lost on restart; the client's offline queue still exists (with a maximum size) | A global rate limit across several instances without Redis |
| B. Keep fail-open (ADR-0010) | No change | Without Redis, no limit on login, sign-up or chat | Any protection against brute force without Redis |
| C. Fail-closed (without Redis, block) | Safer | Login and sign-up stop when Redis goes down | Availability of the system's core |
| D. Turn off the client's offline queue (`disableOfflineQueue`) | Immediate failure | Commands issued before the connection is established fail at process start and in tests | — |

## Decision

Option A.

- Every Redis command has a timeout (300 ms; scan by default, 3 s), the offline queue has a maximum size (100) and reconnection backs off up to 5 s. A failure becomes a "miss" and is logged at most every 30 s.
- Atomic rate-limit counting (`SET key 0 EX window NX` + `INCR` in a transaction). Without Redis, an in-memory counter in the process.
- The client IP is the N-th entry, counted from the end, of `x-forwarded-for`, with N = `TRUST_PROXY_HOPS` (default 1, the reverse proxy of the publishing compose). With 0, the header is ignored.
- `/api/health`: 200 if the database responds (Redis down = `degradado`); 503 only if the database fails.
- The product listing cache key comes from the validated filters, in a fixed order (REQ-CAT-10), and simultaneous accesses to the same key share a single lookup (REQ-OPS-17).

## Rationale

It keeps Redis optional (a differentiator of the project) without costing availability or security. The in-memory reservation is acceptable because there is one instance; with several, the effective limit becomes N times larger and the ADR must be revisited.

## Consequences

- Without Redis, each process counts on its own; restarting resets the count.
- `/api/health` now has the `status` field ("ok", "degradado", "indisponivel"), besides `ok` and `services`.
- Affects: `lib/redis.ts`, `lib/rate-limit.ts`, `lib/cache/**`, `services/health.service.ts`, `app/api/health/route.ts`, `services/product.service.ts`, `lib/schemas/product.ts`.

## Verification

`tests/integration/redis-and-cache.test.ts`, including a child process pointing to a nonexistent Redis that measures the time of each operation.
