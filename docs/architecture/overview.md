# Arquitetura do EcoShop (visão atual)

Descrição verificada no código em 2026-11 (ver `docs/discovery/2026-11-baseline/02-arquitetura-atual.md` para o detalhe). Decisões: `docs/architecture/adr/`.

```mermaid
flowchart LR
  subgraph Browser
    P[Páginas client] --> H[Hooks useFetch/useMutation<br/>cache Map 30s]
  end
  subgraph Next[Next.js - Node]
    MW[Edge middleware] --> RH[Route Handlers app/api]
    RH --> AZ[Guards requireAuth/requireAdmin]
    RH --> SV[Services]
    SV --> CA[Cache lib/cache]
    RH --> AI[lib/ai]
    SV --> FS[(public/data_fotos)]
  end
  H -->|fetch /api| MW
  SV --> DB[(PostgreSQL)]
  CA --> RD[(Redis)]
  AI --> AZV[Azure Custom Vision]
  AI --> GEM[Gemini]
```

## Regras estruturais (Constitution, Art. V)
- Route Handler: parse, validação (Zod), autorização, mapeamento de erro.
- Service: regras, persistência, cache.
- Adaptadores (`lib/ai/providers`, `lib/redis`): sem regra de negócio.
- Autorização por handler (ADR-0017); o middleware autentica e restringe páginas `/painel`.

## Autorização efetiva (por rota)
Fonte de verdade: `docs/capabilities/autorizacao/spec.md`.
