# ADR-0016: Testes com o runner nativo do Node (via tsx) contra Postgres e Redis reais

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: nova
- Capacidades: processo

## Contexto
Não existia nenhum teste. A Constitution (Art. II) exige testes por REQ, incluindo integração com Postgres real.

## Problema
Qual ferramenta de teste, sem adicionar dependência desnecessária?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. `node:test` + `tsx` (escolhida, provisória) | Zero dependência nova; suficiente para services e Route Handlers | Sem utilidades de componente React | — |
| B. Vitest | Ecossistema, mocks, watch | Dependência nova | — |
| C. Jest | Conhecido | Config pesada com ESM/TS | — |

## Decisão
Opção A para unidade/integração; Playwright para E2E quando houver jornada que justifique (não há ainda). Reavaliar (Vitest) se surgirem testes de componente.

## Justificativa
Menor pilha que cobre a pirâmide atual; `tsx` já é dependência.

## Consequências
Testes exigem `DATABASE_URL` e `REDIS_URL`; o CI sobe os serviços. Afeta: `tests/**`, CI.

## Verificação
`npm test` no CI.
