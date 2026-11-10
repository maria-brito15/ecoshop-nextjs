# PROD · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-PROD-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-PROD-02 | ❌ | código: services/marca.service.ts não invalida o prefixo produtos: (NFR-CONS-01); teste todo em catalogo.test.ts | 2026-11-10 |
| REQ-PROD-03 | ❌ | código: app/api/produtos/[id]/route.ts (PUT) não mapeia P2025 e responde 500 | 2026-11-10 |
| REQ-PROD-04 | ❔ | inferido: a violação de FK não é tratada; verificar em teste | 2026-11-10 |
| REQ-PROD-05 | ❔ | código: não há API para o vínculo produto↔certificado (só o seed o preenche); confirmar se é requisito | 2026-11-10 |
