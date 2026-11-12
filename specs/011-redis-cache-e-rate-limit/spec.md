# Change spec: 011-redis-cache-e-rate-limit

- **Track:** fix with a rule change (Constitution Art. VIII and IX; REQ-OPS-01 amended)
- **Affected capabilities:** OPS, AUTH (rate limit), CAT (cache key)
- **Status:** Implemented on 2026-11-11 (the owner's technical autonomy); consolidated in `docs/capabilities/operacao` and `catalogo`
- **Author / approver:** Claude / owner ("local memory" decision of 2026-11-11)

## Problem

Audit of 2026-11-11: Redis being down could hang requests (offline queue without a timeout); the rate limit let everything through without Redis and used non-atomic `INCR` + `EXPIRE`; the client IP could be forged through `x-forwarded-for`; the listing's cache key was built from the raw URL (the number of keys controlled by the caller); simultaneous accesses to an empty key all went to the database; `/api/health` gave 503 when only Redis went down.

## Out of scope

Negative caching (absence of a product), cache consistency between invalidating and repopulating (P05), a rate limit shared between several instances without Redis (the project runs with one instance), changing the TTLs.

## Requirements

REQ-OPS-14, 15, 16, 17 and the amendment of REQ-OPS-01, in `docs/capabilities/operacao/spec.md`; REQ-CAT-10 in `docs/capabilities/catalogo/spec.md`. Decision recorded in **ADR-0020** (supersedes ADR-0010).

## Scenarios and edge cases

- The timeouts (300 ms per command, 3 s for a scan) are initial values **without measurement** ❔.
- The in-memory reservation is per process and resets on restart.
- Without a trusted proxy (`TRUST_PROXY_HOPS=0`), all clients fall into the same `unknown` bucket: more restrictive, but not circumventable.
- The Docker healthcheck and the deploy stop failing when only Redis goes down.

## Affected interfaces

`lib/redis.ts` · `lib/rate-limit.ts` · `lib/cache/{index,keys}.ts` · `lib/log.ts` (new) · `services/health.service.ts` (new) · `app/api/health/route.ts` · `services/product.service.ts` · `lib/schemas/product.ts` · `app/api/produtos/route.ts` · `.env.example` · compose.

## Delta in the living spec

Operations (REQ-OPS-01 amended, 14–17) and catalog (REQ-CAT-10), with `status.md`; authentication (rate-limit note).

## Open questions

None blocking.
