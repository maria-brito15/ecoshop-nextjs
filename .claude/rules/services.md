---
paths: ["services/**"]
---
- Services contêm regra de negócio e acesso ao Prisma; não conhecem `Request`/`Response`.
- Selecione campos explicitamente em dados de usuário (`USUARIO_PUBLICO`); nunca devolva `senha`.
- Mutação que afeta listagens invalida o cache (`lib/cache`, ADR-0009).
