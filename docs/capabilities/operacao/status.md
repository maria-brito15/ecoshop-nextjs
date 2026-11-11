# OPS · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-OPS-01 | ◐ | test: tests/integration/redis-and-cache.test.ts (a regra de composição `comporRelatorio`, 4 combinações); tests/integration/operations.test.ts (ambos no ar → 200) **não foi reexecutado** (precisa de banco). Emendado em 2026-11-11: Redis fora = 200 `degradado` | 2026-11-11 |
| REQ-OPS-02 | ◐ | test: tests/integration/operations.test.ts (seed com hash bcrypt real; emendado em 2026-11-11 para não ter senha embutida — o teste agora fornece `SEED_USER_PASSWORD`, mas **não foi executado** na 008: não havia banco de teste disponível) | 2026-11-11 |
| REQ-OPS-03 | ✅ | test: tests/integration/operations.test.ts (corrigido D5: prisma/seed.ts só cria produtos se o catálogo estiver vazio; nunca mais apaga) | 2026-11-10 |
| REQ-OPS-04 | ◐ | código: .github/workflows/ci.yml reescrito em 2026-11-10; ainda não executado no GitHub | 2026-11-10 |
| REQ-OPS-05 | ◐ | código: .github/workflows/ci.yml (jobs docker e deploy reescritos na 008: imagem + migrator no GHCR, deploy por ssh/scp com `scripts/deploy/deploy.sh`); **nunca executado no GitHub nem num servidor** | 2026-11-11 |
| REQ-OPS-06 | ✅ | test: tests/integration/operations-delivery.test.ts (regra e `register()`); manual: 2026-11-11 `node scripts/ops/check-boot.mjs` contra o servidor standalone real — com segredo ausente, curto e valor-exemplo encerra com código 1; com segredo válido inicia. Achado: o Next só loga erro lançado no hook e mantém o processo vivo, por isso `register()` chama `process.exit(1)` (`lib/config/verify-environment.ts`). `next build` sem `JWT_SECRET` passa | 2026-11-11 |
| REQ-OPS-07 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose config` sem as variáveis falha nomeando `POSTGRES_PASSWORD`, com elas valida (base+override, base, prod) | 2026-11-11 |
| REQ-OPS-08 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose config` do base só publica a porta 3000 | 2026-11-11 |
| REQ-OPS-09 | ◐ | test: tests/integration/operations-delivery.test.ts (falha sem gravar, criação do ADMIN, ausência de senha no código) — os que precisam de banco **não foram executados** (sem banco de teste); manual: 2026-11-11 `seed.ts` e `seed-admin.ts` com senha ausente ou de 11 caracteres saem com código 1 antes de acessar o banco (verificado com `DATABASE_URL` inalcançável) | 2026-11-11 |
| REQ-OPS-10 | ◐ | test: tests/integration/operations-config.test.ts (ordem migrate → up → saúde → reversão, `set -eu`, ssh/scp com host verificado, sem `appleboy`); **o script nunca foi executado e a reversão não foi ensaiada**, nem localmente (o daemon do Docker não estava ativo) nem em servidor | 2026-11-11 |
| REQ-OPS-11 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 `docker compose -f docker-compose.prod.yml config` valida com as variáveis e falha sem elas. O job `docker` do CI que publica a imagem `migrator` não foi executado | 2026-11-11 |
| REQ-OPS-12 | ✅ | test: tests/integration/operations-config.test.ts; manual: 2026-11-11 servidor standalone real, `/about` e `/api/health` devolvem os 4 cabeçalhos e `Strict-Transport-Security: max-age=300` em produção | 2026-11-11 |
| REQ-OPS-13 | ✅ | test: tests/integration/operations-config.test.ts (Dockerfile e compose por digest; `.github/dependabot.yml`); digests obtidos com `docker buildx imagetools inspect` em 2026-11-11; o Dependabot ainda não foi ativado no GitHub | 2026-11-11 |
| REQ-OPS-14 | ✅ | test: tests/integration/redis-and-cache.test.ts (processo filho com Redis inexistente: operações em milissegundos; `comPrazo`). Tempos limite (300 ms; varredura 3 s) são valores iniciais sem medição | 2026-11-11 |
| REQ-OPS-15 | ✅ | test: tests/integration/redis-and-cache.test.ts (contagem no Redis com TTL, reserva em memória, janela expirando; processo filho sem Redis bloqueia o 2º acesso) | 2026-11-11 |
| REQ-OPS-16 | ✅ | test: tests/integration/redis-and-cache.test.ts (1, 2 e 0 proxies; valor forjado; `TRUST_PROXY_HOPS`). Depende de o proxy reverso real acrescentar o IP a `x-forwarded-for` ❔ | 2026-11-11 |
| REQ-OPS-17 | ✅ | test: tests/integration/redis-and-cache.test.ts (8 chamadas concorrentes; falha não fica presa) | 2026-11-11 |
| REQ-OPS-18 | ✅ | test: tests/integration/operations-delivery.test.ts (4 URLs inválidas, todos os problemas juntos, Redis opcional); o caso válido também roda no teste de boot real (`scripts/ops/check-boot.mjs`, CI) | 2026-11-11 |
| REQ-OPS-19 | ✅ | test: tests/integration/log.test.ts (JSON, redação em profundidade, URLs, erro serializado, `ERROS.interno`, limitador de frequência). Os 36 pontos de `ERROS.interno` em `app/api` passam a causa; 2 `default` de `switch` em `fotos` não têm causa | 2026-11-11 |
| REQ-OPS-20 | ◐ | código: .github/workflows/ci.yml (teto de 16 avisos, hoje o lint tem 16; antes eram 33) e .github/dependabot.yml (npm). **A auditoria está como `continue-on-error`**: em 2026-11-11 achou 15 vulnerabilidades em dependências de produção (1 crítica em `next`, 11 altas: prisma, zod, postcss, sharp, hono e outras), quase todas com correção sem quebra via `npm audit fix`, que troca muitas dependências e **não foi aplicada nem validada**. Nada disso foi executado no GitHub | 2026-11-11 |
