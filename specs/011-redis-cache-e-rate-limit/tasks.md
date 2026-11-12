# Tasks: 011-redis-cache-e-rate-limit

- **Status:** Completed on 2026-11-11, without commits.

| # | Task | REQ | Done when |
|---|---|---|---|
| T1 | `withTimeout`, bounded queue, warnings limited to 1 every 30 s | REQ-OPS-14 | child process without Redis: operations in ms |
| T2 | Atomic rate limit, in-memory reservation, IP by `TRUST_PROXY_HOPS` | REQ-OPS-15, 16 | the tests pass |
| T3 | Cache key from the validated filters; `nome` ≤ 100; the service receives typed filters | REQ-CAT-10 | the tests pass |
| T4 | Single-flight in `withCache` | REQ-OPS-17 | 8 calls → 1 lookup |
| T5 | Health `ok`/`degradado`/`indisponivel` | REQ-OPS-01 | rule tested; the test with a database **was not re-run** |
| T6 | ADR-0020, living specs, `.env.example`, compose | all | `sdd:check` green |
