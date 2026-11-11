# ADR-0008: Autorização em duas camadas: middleware por prefixo e guard por handler

- Status: Substituído
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: inferida do código
- Capacidades: AUTZ
- Substituído por: ADR-0017

## Contexto
Evidência: `middleware.ts` + `config/protected-routes.ts` (por prefixo) e `app/_middleware/auth.ts` (`requireAuth`/`requireAdmin`). Divergiam: o middleware exigia ADMIN em `/api/usuarios/*`, enquanto o handler permitia o próprio usuário (D1).

## Problema
Onde mora a decisão de quem pode o quê?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Duas camadas (atual) | Defesa em profundidade | Regras duplicadas que divergem | — |

## Decisão
Descrição histórica do estado antes do ADR-0017, que a substitui.

## Justificativa
—

## Consequências
Causa do defeito D1.

## Verificação
—
