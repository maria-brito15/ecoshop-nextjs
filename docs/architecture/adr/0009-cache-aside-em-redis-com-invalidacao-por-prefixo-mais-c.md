# ADR-0009: Cache-aside em Redis com invalidação por prefixo, mais cache de 30 s no cliente

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: CAT, PROD, REF

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `lib/cache/*` (`comCache`, `PREFIX`, `TTL`), invalidação por `SCAN`+`DEL`. Lacuna: produtos embutem marca e categoria, mas mudar uma marca não invalida `produtos:*`.

## Problema
Como reduzir leituras no banco mantendo coerência aceitável?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Cache-aside por prefixo (atual) | Simples | Invalidação cruzada manual e esquecível | — |
| B. Tags por entidade | Invalidação precisa | Mais código | — |
| C. Sem cache | Consistência total | Mais carga no banco | — |

## Decisão
Manter A como histórica; política de consistência por recurso pendente (P05, com medição).

## Justificativa
Inferida.

## Consequências
Dado velho por até 3–5 min após mutações cruzadas. Afeta: `lib/cache/**`, `services/**`.

## Verificação
Testes 'mutação X → leitura Y' (Art. IX).
