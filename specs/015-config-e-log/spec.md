# Spec de mudança: 015-config-e-log

- **Trilha:** completa (curta)
- **Capacidades afetadas:** OPS
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono), **sem commits**; consolidada nas specs vivas
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

`DATABASE_URL` só falhava na primeira consulta; `ERROS.interno` e o Redis não deixavam rastro estruturado.

## Fora de escopo

Schema único para TODAS as variáveis (só as obrigatórias de produção foram cobertas); tracing/APM (Art. XIII).

## Requisitos

REQ-OPS-18, 19.

## Decisão registrada

nenhum (Constitution Art. XII.2 e XIII.1).

## Verificação

`tests/integration/log.test.ts` e `operations-delivery.test.ts` (executados, sem banco).

## Perguntas em aberto

Nenhuma bloqueante.
