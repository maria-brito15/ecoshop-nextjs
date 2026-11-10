# ADR-0005: Camadas handler → service → Prisma, organizadas por pasta técnica

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: todas

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `app/api/**/route.ts` chama `services/*.service.ts`, que usam `lib/db`; schemas em `lib/schemas`. Exceções: `api/auth`, `api/auth/me`, `api/auth/refresh`, `api/users` e `api/health` usam Prisma direto.

## Problema
Onde mora cada responsabilidade?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Camadas por pasta técnica (atual) | Simples de navegar | Domínio espalhado por pastas | — |
| B. Módulos verticais por domínio | Coesão por capacidade | Reorganização grande | — |

## Decisão
Ratificar A, com a regra da Constitution (Art. V): handler não acessa Prisma. As exceções existentes são débito registrado (lint em 'warn').

## Justificativa
A convenção já é seguida em 12 dos 17 handlers; fixá-la evita erosão.

## Consequências
Migrar os handlers que violam é uma spec de mudança futura. Afeta: `app/api/**`, `services/**`.

## Verificação
ESLint `no-restricted-imports` (aviso agora; erro depois da migração).
