# SCAN · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-SCAN-01 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-02 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-03 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-04 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-05 | ✅ | test: tests/integration/entrada-e-erros.test.ts (`analisarImagem` com o Gemini lançando erro → contingência, executado sem banco); o teste da rota em ecoscan.test.ts perdeu o `todo` e **não foi executado** (precisa de banco). Corrigido na 009: `gerarTexto` captura a falha | 2026-11-11 |
| REQ-SCAN-06 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-07 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-08 | ◐ | código: app/(ia-scan); sem teste de interface | 2026-11-10 |
| REQ-SCAN-09 | ✅ | test: tests/integration/entrada-e-erros.test.ts (`fetchComTimeout` e os dois provedores com tempo curto injetado). Tempos padrão (Azure 10 s, Gemini 20 s) são valores iniciais **sem medição** | 2026-11-11 |
