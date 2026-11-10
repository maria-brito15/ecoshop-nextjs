---
paths: ["prisma/**"]
---
- Mudança de schema exige migration versionada (`prisma migrate dev`) e ADR citado (ADR-0006).
- Não edite migration já aplicada; crie outra.
- `prisma/schema.prisma` é a única cópia do schema.
