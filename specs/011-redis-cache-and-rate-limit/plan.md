# Plan: 011-redis-cache-and-rate-limit

- **Status:** Implemented on 2026-11-11. ADR-0020 (Accepted) supersedes ADR-0010.
- **Decisions:** see ADR-0020 (alternatives and consequences). Implementation details: `withTimeout` + a bounded offline queue on the client; `SET NX EX` + `INCR` in a transaction; `WindowCounter` as an interface with two implementations (Redis and memory), with injection only in `rateLimit` for testing; single-flight with a `Map` of in-flight promises; health composed by a pure function (`buildHealthReport`).
- **Verification:** `tests/integration/redis-and-cache.test.ts` (16 tests, without a database; one of them starts a child process with a nonexistent Redis).
