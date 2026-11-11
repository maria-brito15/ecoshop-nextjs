# MIDIA · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-MIDIA-01 | ✅ | test: tests/integration/media.test.ts | 2026-11-10 |
| REQ-MIDIA-02 | ✅ | test: tests/integration/media.test.ts (extensão não permitida e arquivo > 5MB, ambos 400) | 2026-11-10 |
| REQ-MIDIA-03 | ✅ | test: tests/integration/media.test.ts | 2026-11-10 |
| REQ-MIDIA-04 | ◐ | código: app/(store)/produtos/[id]/page.tsx consome useListarFotos e exibe miniaturas clicáveis; API confirmada via curl contra o dev server (produto com 2 fotos). Falta verificação visual no navegador (sem essa ferramenta neste ambiente) | 2026-11-10 |
| REQ-MIDIA-05 | ✅ | test: tests/integration/input-and-errors.test.ts (GET e DELETE; o POST usa a mesma validação, sem teste próprio) | 2026-11-11 |
| REQ-MIDIA-06 | ✅ | test: tests/integration/media-content.test.ts (`gravarFoto` com pasta temporária: assinatura, extensão incompatível, vazio, 4 tipos válidos, limites). O mapeamento HTTP (`CONTEUDO_NAO_E_IMAGEM` → 400) é verificado por `tsc` (união de tipos), **sem teste de rota** (precisa de banco). `media.test.ts` foi ajustado para enviar JPEG válido e **não foi reexecutado** | 2026-11-11 |
| REQ-MIDIA-07 | ✅ | test: tests/integration/media-content.test.ts (dois `gravarFoto` concorrentes; flag `wx`). Substituiu o `readdir` + gravação, que tinha corrida | 2026-11-11 |
