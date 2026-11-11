# Spec de mudança: 014-midia

- **Trilha:** correção com mudança de regra
- **Capacidades afetadas:** MIDIA
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono), **sem commits**; consolidada nas specs vivas
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

Upload validava só a extensão do nome; checagem de nome por `readdir` + gravação tinha corrida.

## Fora de escopo

Armazenamento de objetos (só se houver mais de uma instância) e verificar se o Next serve em produção arquivos gravados depois do início ❔.

## Requisitos

REQ-MIDIA-06, 07.

## Decisão registrada

ADR-0011 (segue: fotos no filesystem; instância única).

## Verificação

`tests/integration/midia-conteudo.test.ts` (6 testes, sem banco, executados).

## Perguntas em aberto

Nenhuma bloqueante.
