# OPS · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-OPS-01 | ✅ | test: tests/integration/operacao.test.ts | 2026-11-10 |
| REQ-OPS-02 | ❌ | código: prisma/seed.ts:177 cria usuários com senha placeholder "hash-seguro-aqui" (não é hash válido), então ninguém loga; prisma/seed-admin.ts (npm run seed:admin) existe, mas o compose não o executa; o README cita credenciais que não funcionam (D6) | 2026-11-10 |
| REQ-OPS-03 | ❌ | código: prisma/seed.ts:74-75 apaga produtos e vínculos; o serviço seed roda em todo compose up (docker-compose.yml:64) (D5) | 2026-11-10 |
| REQ-OPS-04 | ◐ | código: .github/workflows/ci.yml reescrito em 2026-11-10; ainda não executado no GitHub | 2026-11-10 |
| REQ-OPS-05 | ❔ | o job de deploy existia, mas nunca rodou (CI falhava no lint); destino e política a confirmar | 2026-11-10 |
