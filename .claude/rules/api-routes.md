---
paths: ["app/api/**"]
---
- Valide a entrada com Zod (`lib/schemas`) antes de usar; erro de validação → 400 com `{ erro }`.
- Decisão de acesso no handler: `requireAuth`/`requireAdmin` (`app/_middleware/auth.ts`) e checagem de dono (ADR-0017). 401 sem sessão, 403 sem permissão.
- Chame `services/`; não importe `@/lib/db` no handler (Art. V).
- Mapeie erros conhecidos (404, 409) em vez de deixar virar 500; nunca devolva hash de senha.
- Mudou comportamento? Atualize o REQ e o teste `REQ-…` na mesma mudança.
