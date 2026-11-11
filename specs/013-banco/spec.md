# Spec de mudança: 013-banco

- **Trilha:** correção + migration
- **Capacidades afetadas:** PROD
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono), **sem commits**; consolidada nas specs vivas
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

Sem índices nas FKs `categoria_id`, `marca_id`, `certificado_id`; comentário dizia "cascata" mas o banco bloqueia (decisão do dono: bloqueio).

## Fora de escopo

Índice de busca por nome (`pg_trgm`): só com medição que o justifique.

## Requisitos

REQ-PROD-07.

## Decisão registrada

ADR-0006 (segue).

## Verificação

Migration `20261111120000_indices_de_chaves_estrangeiras` gerada por `prisma migrate diff` (**não aplicada**); `tests/integration/database.test.ts` (**não executado**, precisa de banco).

## Perguntas em aberto

Nenhuma bloqueante.
