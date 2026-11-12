# EcoShop architecture (current view)

Description verified against the code in 2026-11 (see `docs/discovery/2026-11-baseline/02-arquitetura-atual.md` for the detail). Decisions: `docs/architecture/adr/`.

```mermaid
flowchart LR
  subgraph Browser
    P[Client pages] --> H[Hooks useFetch/useMutation<br/>Map cache 30s]
  end
  subgraph Next[Next.js - Node]
    MW[Edge middleware] --> RH[Route Handlers app/api]
    RH --> AZ[Guards requireAuth/requireAdmin]
    RH --> SV[Services]
    SV --> CA[Cache lib/cache]
    RH --> AI[lib/ai]
    SV --> FS[(public/data_photos)]
  end
  H -->|fetch /api| MW
  SV --> DB[(PostgreSQL)]
  CA --> RD[(Redis)]
  AI --> AZV[Azure Custom Vision]
  AI --> GEM[Gemini]
```

## Structural rules (Constitution, Art. V)
- Route Handler: parsing, validation (Zod), authorization, error mapping.
- Service: rules, persistence, cache.
- Adapters (`lib/ai/providers`, `lib/redis`): no business rules.
- Authorization per handler (ADR-0017); the middleware authenticates and restricts `/dashboard` pages.

## Effective authorization (per route)
Source of truth: `docs/capabilities/authorization/spec.md`.
