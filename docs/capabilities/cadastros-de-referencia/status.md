# REF · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-REF-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-REF-02 | ✅ | test: tests/integration/catalogo.test.ts (corrigido: mapeiaErro usa err.code, P2002 → 409) | 2026-11-10 |
| REQ-REF-03 | ✅ | test: tests/integration/catalogo.test.ts (corrigido D7: a causa era checar err.message.includes("P2025") em vez de err.code; agora usa err.code === "P2003" → 409) | 2026-11-10 |
| REQ-REF-04 | ✅ | test: tests/integration/catalogo.test.ts (decisão 2026-11-10: dono da marca precisa ser MARCA ou ADMIN; marca.service.ts valida antes de criar) | 2026-11-10 |
| REQ-REF-05 | ✅ | test: tests/integration/entrada-e-erros.test.ts (3 recursos × 3 métodos; `parseId` testado à parte) | 2026-11-11 |
