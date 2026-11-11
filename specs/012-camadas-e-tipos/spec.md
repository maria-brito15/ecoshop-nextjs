# Spec de mudança: 012-camadas-e-tipos

- **Trilha:** sem comportamento (refatoração)
- **Capacidades afetadas:** AUTH, OPS
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono), **sem commits**; consolidada nas specs vivas
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

Handlers `auth`, `auth/refresh`, `auth/me`, `users` e `health` importavam `@/lib/db`; `setAuthCookie(res: any)`; casts de `tipo`; `lib/auth/contracts.ts` sem consumidor.

## Fora de escopo

Quebrar `JwtService`, unificar `types/api.ts` com Zod/Prisma e decompor `criarUsuario` (ficam para uma onda própria com testes de banco).

## Requisitos

nenhum REQ novo; cobre a regra de camadas (Constitution Art. V).

## Decisão registrada

nenhum.

## Verificação

`grep "@/lib/db" app/` vazio; `tsc`; testes das ondas 009–011.

## Perguntas em aberto

Nenhuma bloqueante.
