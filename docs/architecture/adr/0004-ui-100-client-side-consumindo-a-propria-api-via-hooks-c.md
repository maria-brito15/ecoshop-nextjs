# ADR-0004: UI 100% client-side consumindo a própria API via hooks com cache em memória

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: CAT, PROD, REF, PERF

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: todas as páginas têm `"use client"`; `lib/hooks/useFetch.ts` mantém `Map` com TTL de 30 s e stale-while-revalidate; `useMutation.ts` invalida por substring de URL.

## Problema
Como a UI busca e mantém dados frescos?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Hooks próprios (atual) | Sem dependência | Reimplementa cache, deduplicação e invalidação (frágil por substring) | — |
| B. TanStack Query / SWR | Cache, deduplicação e invalidação prontos | Dependência nova | — |
| C. Server Components com `fetch` do Next | Menos JS no cliente, SEO | Reescrever páginas | — |

## Decisão
Manter A por ora (histórica). Decisão definitiva fica pendente (P07) para quando as páginas grandes forem decompostas.

## Justificativa
Inferida: funciona e não exige dependência.

## Consequências
O cache do cliente pode mostrar dado de até 30 s; a invalidação por substring é frágil. Afeta: `lib/hooks/**`, páginas.

## Verificação
—
