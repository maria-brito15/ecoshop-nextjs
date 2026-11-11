# ADR-0007: Sessão stateless: JWT HS256 em cookie httpOnly por 7 dias, sem revogação

- Status: Substituído
- Substituído por: ADR-0021
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: AUTH, AUTZ

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `lib/auth/jwt.ts` (`setExpirationTime('7d')`, cookie `httpOnly`, `sameSite: lax`); `/api/auth/refresh` só reemite se o tipo mudou. O README diz `SameSite=Strict`, o código usa `lax`.

## Problema
Como manter sessão e quão rápido uma mudança de papel ou exclusão deve valer?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. JWT longo sem revogação (atual) | Simples; funciona no Edge | Usuário excluído ou rebaixado mantém acesso até 7 dias | — |
| B. JWT curto + refresh em Redis/banco | Revogação rápida | Mais componentes | — |
| C. Sessão em banco | Revogação imediata | Leitura de banco por requisição | Edge sem acesso ao banco |

## Decisão
Manter A como histórica. Decisão definitiva pendente (P02): ainda sem produção, é o melhor momento de decidir.

## Justificativa
Inferida: simplicidade.

## Consequências
Risco aceito implicitamente. Afeta: `lib/auth/**`, `middleware.ts`.

## Verificação
REQ-AUTH em docs/capabilities/autenticacao.
