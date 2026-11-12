---
paths: ["prisma/**"]
---
- A schema change requires a versioned migration (`prisma migrate dev`) and a cited ADR (ADR-0006).
- Do not edit an already applied migration; create another one.
- `prisma/schema.prisma` is the only copy of the schema.
