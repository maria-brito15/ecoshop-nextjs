# OPS · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-OPS-01 | ✅ | test: tests/integration/operacao.test.ts | 2026-11-10 |
| REQ-OPS-02 | ✅ | test: tests/integration/operacao.test.ts (corrigido D6: prisma/seed.ts gera hash bcrypt real com SEED_USER_PASSWORD; senha padrão documentada no README e no próprio seed) | 2026-11-10 |
| REQ-OPS-03 | ✅ | test: tests/integration/operacao.test.ts (corrigido D5: prisma/seed.ts só cria produtos se o catálogo estiver vazio; nunca mais apaga) | 2026-11-10 |
| REQ-OPS-04 | ◐ | código: .github/workflows/ci.yml reescrito em 2026-11-10; ainda não executado no GitHub | 2026-11-10 |
| REQ-OPS-05 | ❔ | o job de deploy existia, mas nunca rodou (CI falhava no lint); destino e política a confirmar | 2026-11-10 |
