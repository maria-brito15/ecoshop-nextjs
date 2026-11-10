# MIDIA · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-MIDIA-01 | ✅ | test: tests/integration/midia.test.ts | 2026-11-10 |
| REQ-MIDIA-02 | ✅ | test: tests/integration/midia.test.ts (extensão não permitida e arquivo > 5MB, ambos 400) | 2026-11-10 |
| REQ-MIDIA-03 | ✅ | test: tests/integration/midia.test.ts | 2026-11-10 |
| REQ-MIDIA-04 | ❌ | decidido (2026-11-10): fica em backlog; o README atual não promete mais isso, mas a galeria continua não implementada na tela (o armazenamento já suporta várias fotos por produto, ver ADR-0011). Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
