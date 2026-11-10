# REF · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-REF-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-REF-02 | ❌ | código: a violação de unicidade chega ao catch genérico e vira 500; teste todo em catalogo.test.ts (categoria) | 2026-11-10 |
| REQ-REF-03 | ❌ | código: a FK RESTRICT gera erro Prisma P2003; o handler responde 404 (a mensagem do erro contém o trecho "P2025" do código-fonte) — D7; teste todo | 2026-11-10 |
| REQ-REF-04 | ❔ | código: marcaSchema só pede usuarioId inteiro; confirmar a regra | 2026-11-10 |
