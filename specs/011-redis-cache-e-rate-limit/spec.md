# Spec de mudança: 011-redis-cache-e-rate-limit

- **Trilha:** correção com mudança de regra (Constitution Art. VIII e IX; REQ-OPS-01 emendado)
- **Capacidades afetadas:** OPS, AUTH (rate limit), CAT (chave de cache)
- **Status:** Implementada em 2026-11-11 (autonomia técnica do dono); consolidada em `docs/capabilities/operacao` e `catalogo`
- **Autor / aprovador:** Claude / dono (decisão "memória local" de 2026-11-11)

## Problema

Auditoria de 2026-11-11: Redis fora do ar podia pendurar requisições (fila offline sem tempo limite); rate limit liberava tudo sem Redis e usava `INCR` + `EXPIRE` não atômicos; IP do cliente forjável por `x-forwarded-for`; chave de cache da listagem montada da URL crua (quantidade de chaves controlada por quem chama); acessos simultâneos a uma chave vazia iam todos ao banco; `/api/health` dava 503 quando só o Redis caía.

## Fora de escopo

Cache negativo (ausência de produto), consistência de cache entre invalidar e repopular (P05), rate limit compartilhado entre várias instâncias sem Redis (o projeto roda com uma instância), mudança dos TTLs.

## Requisitos

REQ-OPS-14, 15, 16, 17 e a emenda de REQ-OPS-01, em `docs/capabilities/operacao/spec.md`; REQ-CAT-10 em `docs/capabilities/catalogo/spec.md`. Decisão registrada no **ADR-0020** (substitui o ADR-0010).

## Cenários e casos-limite

- Os tempos limite (300 ms por comando, 3 s para varredura) são valores iniciais **sem medição** ❔.
- A reserva em memória vale por processo e zera ao reiniciar.
- Sem proxy confiável (`TRUST_PROXY_HOPS=0`), todos os clientes caem no mesmo balde `unknown`: mais restritivo, porém não burlável.
- O Docker healthcheck e o deploy deixam de falhar quando só o Redis cai.

## Interfaces afetadas

`lib/redis.ts` · `lib/rate-limit.ts` · `lib/cache/{index,keys}.ts` · `lib/log.ts` (novo) · `services/health.service.ts` (novo) · `app/api/health/route.ts` · `services/product.service.ts` · `lib/schemas/product.ts` · `app/api/produtos/route.ts` · `.env.example` · compose.

## Delta na spec viva

Operação (REQ-OPS-01 emendado, 14–17) e catálogo (REQ-CAT-10), com `status.md`; autenticação (nota do rate limit).

## Perguntas em aberto

Nenhuma bloqueante.
