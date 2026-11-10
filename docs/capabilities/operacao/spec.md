# OPS · Operação (execução, saúde, build e entrega)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0006 · ADR-0013 · ADR-0016

## Objetivo

Fazer o sistema subir de forma reproduzível, informar sua saúde e passar por verificações antes de ser entregue.

## Atores

Pessoa que opera ou desenvolve o sistema.

## Regras de negócio

- **BR-OPS-01** — Migrations são versionadas em prisma/migrations e aplicadas com migrate deploy.
- **BR-OPS-02** — O CI falha se lint, tipos, testes, specs ou build falham.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-OPS-01 | Quando o endpoint de saúde é consultado, o sistema deve responder 200 informando banco e Redis disponíveis, e 503 se algum falhar. | GET /api/health com ambos no ar → 200 |
| REQ-OPS-02 | Quando o ambiente sobe pela primeira vez com Docker, o sistema deve criar ao menos um usuário ADMIN para acesso ao painel. | docker compose up em banco vazio permite login de ADMIN |
| REQ-OPS-03 | Quando o ambiente reinicia, o sistema deve preservar os dados cadastrados. | docker compose up de novo mantém os produtos |
| REQ-OPS-04 | Quando uma mudança é proposta, o pipeline deve executar lint, tipos, testes de integração, validação das specs e build. | Job do CI contém os 5 passos |
| REQ-OPS-05 | Quando o pipeline passa na branch principal, o sistema deve ser publicado automaticamente no destino definido. | Deploy após CI verde |

## Casos-limite

Sem Redis, cache e rate limit degradam (fail-open, ADR-0010). Projeto ainda não está em produção (resposta do dono).

## Interfaces

GET /api/health · docker-compose.yml · Dockerfile · .github/workflows/ci.yml.

## NFRs aplicáveis

NFR-OPS-01, NFR-OPS-02.

## Fora de escopo

Observabilidade completa (métricas, tracing).

## Perguntas abertas

1. Qual o destino do deploy e a estratégia de rollback (REQ-OPS-05)?
2. Como o primeiro ADMIN deve ser criado: executar seed-admin (ADMIN_EMAIL/ADMIN_PASSWORD) no compose, ou corrigir as senhas do seed?
