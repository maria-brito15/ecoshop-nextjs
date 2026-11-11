# PROD · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-PROD-01 | ✅ | test: tests/integration/catalogo.test.ts | 2026-11-10 |
| REQ-PROD-02 | ✅ | test: tests/integration/catalogo.test.ts (corrigido: categoria.service.ts e marca.service.ts invalidam PRODUTOS também) | 2026-11-10 |
| REQ-PROD-03 | ✅ | test: tests/integration/catalogo.test.ts (corrigido: PUT usa mapeiaErro, lib/http/responses.ts) | 2026-11-10 |
| REQ-PROD-04 | ✅ | test: tests/integration/catalogo.test.ts (P2003 mapeado para 409 via mapeiaErro) | 2026-11-10 |
| REQ-PROD-05 | ✅ | test: tests/integration/catalogo.test.ts (PUT com certificadoIds substitui o vínculo; `[]` remove tudo; id inexistente não é 500) | 2026-11-11 |
| REQ-PROD-06 | ✅ | test: tests/integration/entrada-e-erros.test.ts (corpo válido, para que só o id explique o 400) | 2026-11-11 |
| REQ-PROD-07 | ◐ | test: tests/integration/banco.test.ts (**não executado**: precisa de banco). A FK `produto_certificado` é `ON DELETE RESTRICT` (migration inicial) e o mapeador de erros converte P2003 em 409 (testado sem banco). Comentário errado sobre "cascata" corrigido em `produto.service.ts`. Índices em `categoria_id`, `marca_id` e `certificado_id`: migration `20261111120000_indices_de_chaves_estrangeiras` gerada por `prisma migrate diff`, **não aplicada** | 2026-11-11 |
