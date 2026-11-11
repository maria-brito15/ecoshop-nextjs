# ADR-0020: Redis opcional com falha rápida, rate limit em memória sem Redis e saúde "degradada"

- Status: Aceito
- Data: 2026-11-11
- Decisores: dono do projeto (decisão "memória local" de 2026-11-11 para o rate limit sem Redis) e Claude
- Origem: nova (ratifica e corrige o ADR-0010)
- Capacidades: OPS, AUTH
- Substitui: ADR-0010

## Contexto

O ADR-0010 (Inferido) descrevia o estado do código: o Redis é opcional e tudo "libera" quando ele falha, inclusive o rate limit. A auditoria de 2026-11-11 encontrou quatro problemas nesse desenho:

- O node-redis enfileira comandos enquanto está desconectado e não tem tempo limite: com o Redis fora, as requisições podiam ficar penduradas em vez de "degradar".
- O rate limit liberava tudo sem Redis (fail-open sem decisão registrada; Constitution Art. VIII.3) e usava `INCR` e `EXPIRE` separados, que deixavam a chave sem validade se o processo caísse entre os dois.
- O IP do cliente vinha do primeiro valor de `x-forwarded-for`, que o próprio cliente escreve.
- `/api/health` devolvia 503 quando só o Redis caía, contrariando Art. XIII.2 e derrubando o deploy e o healthcheck.

O dono decidiu (2026-11-11) que, sem Redis, o rate limit usa memória local. O projeto roda com uma instância (resposta do dono).

## Problema

Como manter o Redis opcional sem pendurar requisições, sem abrir mão do rate limit e sem reportar "indisponível" quando só uma dependência opcional cai?

## Alternativas

| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Falha rápida + rate limit em memória + saúde "degradada" (escolhida) | Redis fora não pendura nem libera o limite; saúde correta | Limite por instância e perdido ao reiniciar; fila offline do cliente ainda existe (com tamanho máximo) | Rate limit global entre várias instâncias sem Redis |
| B. Manter fail-open (ADR-0010) | Nenhuma mudança | Sem Redis, nenhum limite de login, cadastro ou chat | Qualquer proteção contra força bruta sem Redis |
| C. Fail-closed (sem Redis, bloquear) | Mais seguro | Login e cadastro param quando o Redis cai | Disponibilidade do núcleo do sistema |
| D. Desligar a fila offline do cliente (`disableOfflineQueue`) | Falha imediata | Comandos emitidos antes de a conexão estabelecer falham no início do processo e nos testes | — |

## Decisão

Opção A.

- Todo comando Redis tem tempo limite (300 ms; varredura por padrão, 3 s), a fila offline tem tamanho máximo (100) e a reconexão recua até 5 s. Falha vira "miss" e é registrada no máximo a cada 30 s.
- Contagem do rate limit atômica (`SET chave 0 EX janela NX` + `INCR` numa transação). Sem Redis, contador em memória do processo.
- O IP do cliente é a N-ésima entrada, contada do fim, de `x-forwarded-for`, com N = `TRUST_PROXY_HOPS` (padrão 1, o proxy reverso do compose de publicação). Com 0, o cabeçalho é ignorado.
- `/api/health`: 200 se o banco responde (Redis fora = `degradado`); 503 só se o banco falha.
- A chave de cache da listagem de produtos sai dos filtros validados, em ordem fixa (REQ-CAT-10), e acessos simultâneos à mesma chave dividem uma só busca (REQ-OPS-17).

## Justificativa

Mantém o Redis opcional (diferencial do projeto) sem custar disponibilidade nem segurança. A reserva em memória é aceitável porque há uma instância; com várias, o limite efetivo fica N vezes maior e o ADR deve ser revisitado.

## Consequências

- Sem Redis, cada processo conta sozinho; reiniciar zera a contagem.
- `/api/health` passa a ter o campo `status` ("ok", "degradado", "indisponivel"), além de `ok` e `services`.
- Afeta: `lib/redis.ts`, `lib/rate-limit.ts`, `lib/cache/**`, `services/health.service.ts`, `app/api/health/route.ts`, `services/product.service.ts`, `lib/schemas/product.ts`.

## Verificação

`tests/integration/redis-and-cache.test.ts`, incluindo um processo filho apontando para um Redis inexistente que mede o tempo de cada operação.
