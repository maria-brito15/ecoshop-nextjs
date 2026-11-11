# USR · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-USR-01 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-USR-02 | ✅ | test: tests/integration/authentication.test.ts | 2026-11-10 |
| REQ-USR-03 | ✅ | test: tests/integration/users.test.ts (ADR-0018: POST /api/marcas/[id]/aprovar) | 2026-11-10 |
| REQ-USR-04 | ❌ | decidido (2026-11-10): fica em backlog; o README atual não promete mais isso, mas a API existe e a tela de gestão de usuários continua não implementada. Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
| REQ-USR-05 | ✅ | test: tests/integration/users.test.ts | 2026-11-10 |
| REQ-USR-06 | ✅ | test: tests/integration/input-and-errors.test.ts (GET, PUT, DELETE de usuários e aprovar marca; ordem sessão → id) | 2026-11-11 |
| REQ-USR-07 | ◐ | test: tests/integration/input-and-errors.test.ts (o mapeador de erros, executado sem banco); os testes de ponta a ponta (404, 409 por e-mail, 409 por marca) **não foram executados** (precisam de banco) | 2026-11-11 |
| REQ-USR-08 | ✅ | test: tests/integration/input-and-errors.test.ts (a regra vale antes de qualquer acesso ao banco) | 2026-11-11 |
