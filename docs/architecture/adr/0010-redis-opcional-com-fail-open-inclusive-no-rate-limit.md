# ADR-0010: Redis opcional com fail-open, inclusive no rate limit

- Status: Substituído
- Substituído por: ADR-0020
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: AUTH, OPS

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `lib/redis.ts` engole erros; `lib/rate-limit.ts` retorna `bloqueado: false` se o Redis falha; `/api/health` devolve 503 quando só o Redis cai.

## Problema
O que acontece quando o Redis está fora?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Fail-open (atual) | Disponibilidade | Sem limite de tentativas de login sem Redis | — |
| B. Fail-closed no rate limit | Segurança | Login indisponível sem Redis | — |
| C. Fallback em memória por instância | Meio-termo | Limite por instância | — |

## Decisão
Manter A como histórica; pendente (P04). Inconsistência a decidir: health tratar Redis como obrigatório contradiz 'opcional'.

## Justificativa
Inferida: degradação graciosa declarada no README.

## Consequências
Brute-force sem Redis. Afeta: `lib/redis.ts`, `lib/rate-limit.ts`, `api/health`.

## Verificação
Testes de adaptador com Redis simulado em falha (Art. VIII).
