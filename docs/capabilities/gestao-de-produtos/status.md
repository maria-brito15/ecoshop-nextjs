# PROD · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-PROD-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-PROD-02 | ✅ | test: tests/integration/catalogo.test.ts (corrigido: categoria.service.ts e marca.service.ts invalidam PRODUTOS também) | 2026-11-10 |
| REQ-PROD-03 | ✅ | test: tests/integration/catalogo.test.ts (corrigido: PUT usa mapeiaErroPrisma, lib/http/responses.ts) | 2026-11-10 |
| REQ-PROD-04 | ✅ | test: tests/integration/catalogo.test.ts (P2003 mapeado para 409 via mapeiaErroPrisma) | 2026-11-10 |
| REQ-PROD-05 | ❌ | decidido (2026-11-10): fica em backlog; não há API para o vínculo produto↔certificado (só o seed o preenche). Ver docs/architecture/adr/pendentes.md | 2026-11-10 |
