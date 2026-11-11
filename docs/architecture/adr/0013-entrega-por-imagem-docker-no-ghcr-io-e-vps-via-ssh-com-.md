# ADR-0013: Entrega por imagem Docker no ghcr.io e VPS via SSH com Compose

- Status: Substituído
- Substituído por: ADR-0019
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: OPS

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `.github/workflows/ci.yml` (docker → deploy), `docker-compose.yml`, serviço `migrate`. O projeto ainda não está em produção.

## Problema
Como publicar a aplicação?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Docker + VPS por SSH (atual) | Controle total | Operação manual do servidor | — |
| B. PaaS (ex.: Vercel + Postgres gerenciado) | Menos operação | Redis e filesystem a repensar | — |

## Decisão
Manter A como histórica; ratificar quando houver produção.

## Justificativa
Inferida.

## Consequências
Seed destrutivo no `compose up` (D5). Afeta: Dockerfile, Compose, workflow.

## Verificação
—
