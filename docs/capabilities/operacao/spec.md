# OPS · Operação (execução, saúde, build e entrega)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-11. ADRs: ADR-0006 · ADR-0016 · ADR-0019 · ADR-0020

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
| REQ-OPS-01 | Quando o endpoint de saúde é consultado, o sistema deve responder 200 com `status: "ok"` se banco e Redis respondem, 200 com `status: "degradado"` se só o Redis (opcional) falha, e 503 com `status: "indisponivel"` se o banco falha. | GET /api/health com ambos no ar → 200 `ok`; Redis fora → 200 `degradado`; banco fora → 503 |
| REQ-OPS-02 | Quando o ambiente sobe pela primeira vez com Docker, o sistema deve criar um usuário ADMIN para acesso ao painel, com a senha informada em `ADMIN_PASSWORD` (sem senha embutida; ver REQ-OPS-09). | docker compose up em banco vazio, com `ADMIN_PASSWORD` definida, permite login de ADMIN |
| REQ-OPS-03 | Quando o ambiente reinicia, o sistema deve preservar os dados cadastrados. | docker compose up de novo mantém os produtos |
| REQ-OPS-04 | Quando uma mudança é proposta, o pipeline deve executar lint, tipos, testes de integração, validação das specs e build. | Job do CI contém os 5 passos |
| REQ-OPS-05 | Quando o pipeline passa na branch principal, o sistema deve ser publicado automaticamente no servidor, pela imagem do GHCR e pelo compose versionado (REQ-OPS-10/11). | Deploy após CI verde |
| REQ-OPS-06 | Quando a aplicação inicia com `NODE_ENV=production`, o sistema deve recusar iniciar se `JWT_SECRET` estiver ausente, tiver menos de 32 caracteres ou for um valor-exemplo conhecido. | Iniciar o servidor em produção com cada valor inválido → encerra com mensagem clara, sem subir; com valor válido → sobe |
| REQ-OPS-07 | O `docker-compose.yml` não deve conter valor padrão utilizável para nenhum segredo (`JWT_SECRET`, senhas do Postgres, do Redis e do ADMIN, senha dos usuários de demonstração); a falta de qualquer um deve impedir a subida nomeando a variável. | `docker compose config` sem as variáveis → erro nomeando a variável; nenhum `:-` associado a segredo |
| REQ-OPS-08 | O `docker-compose.yml` não deve publicar as portas do Postgres e do Redis no host por padrão; publicá-las é uma escolha explícita de desenvolvimento, só em 127.0.0.1. | Compose base e de publicação sem `5432`/`6379` em `ports`; o override de desenvolvimento as publica em 127.0.0.1 |
| REQ-OPS-09 | Quando o seed roda, o sistema não deve usar senha embutida: `SEED_USER_PASSWORD` e `ADMIN_PASSWORD` são obrigatórios (12+ caracteres) e o seed falha, sem gravar nada, se faltarem. Em produção só o ADMIN é criado; o seed de demonstração roda só em desenvolvimento e o catálogo de produção começa vazio. | Seeds sem a variável → falha antes de qualquer escrita; o compose de publicação não referencia `seed.ts` |
| REQ-OPS-10 | Quando o pipeline publica uma nova versão, o deploy deve aplicar as migrations antes de iniciar a aplicação nova, verificar a saúde depois e, se falhar, voltar à imagem anterior e falhar o job. A reversão não desfaz migrations: elas devem ser compatíveis com a versão anterior. | Script de deploy versionado com a ordem migrate → up → saúde → reversão |
| REQ-OPS-11 | O repositório deve conter o compose usado para publicar (imagem do GHCR por tag de commit), de modo que o deploy seja reproduzível a partir dele. | O job de deploy usa o arquivo versionado; `docker compose -f docker-compose.prod.yml config` válido |
| REQ-OPS-12 | Quando a aplicação responde, o sistema deve incluir `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` restritiva; em produção, também `Strict-Transport-Security` (curto, sem `includeSubDomains` nem `preload`). | Configuração de cabeçalhos lida em teste; HSTS só com `NODE_ENV=production` |
| REQ-OPS-13 | As imagens base do Dockerfile e dos compose devem ser fixadas por digest, com atualização proposta automaticamente (Dependabot). | Nenhuma imagem de terceiros sem digest; `.github/dependabot.yml` cobre docker, docker-compose e github-actions |
| REQ-OPS-14 | Quando o Redis está fora do ar ou lento, o sistema deve falhar rápido em cada comando (tempo limite e fila offline limitada), tratando como miss de cache, sem pendurar a requisição. | Com um Redis inexistente, `get`, `set`, `del`, varredura e rate limit retornam em milissegundos e sem erro |
| REQ-OPS-15 | O rate limit deve contar de forma atômica no Redis (a chave nasce com validade) e, sem Redis, deve usar um contador em memória do processo, mantendo o limite (não liberar tudo). | 3 acessos com limite 2 → o 3º é bloqueado, com e sem Redis; a chave tem TTL |
| REQ-OPS-16 | O sistema deve obter o IP do cliente a partir da N-ésima entrada, contada do fim, de `x-forwarded-for` (N = `TRUST_PROXY_HOPS`, padrão 1); com N = 0, ignorar o cabeçalho. | `9.9.9.9, 203.0.113.7` com N = 1 → `203.0.113.7` (o valor forjado pelo cliente não vale) |
| REQ-OPS-17 | Quando vários acessos simultâneos pedem a mesma chave com o cache vazio, o sistema deve executar uma única busca à fonte e compartilhar o resultado. | 8 chamadas concorrentes → 1 execução do `fetcher` |
| REQ-OPS-18 | Quando a aplicação inicia com `NODE_ENV=production`, o sistema deve recusar iniciar se `DATABASE_URL` estiver ausente ou não for uma URL PostgreSQL, listando todos os problemas de configuração de uma vez e sem revelar valores; `REDIS_URL` é opcional. | Produção sem `DATABASE_URL` (ou `mysql://…`) → encerra com código 1 nomeando a variável |
| REQ-OPS-19 | Quando uma rota responde 500, o sistema deve registrar um log estruturado (uma linha JSON, com o contexto e a causa), sem segredos: chaves sensíveis e credenciais em URLs saem mascaradas; o corpo da resposta não traz detalhe da causa. | `ERROS.interno(contexto, causa)` responde 500 e escreve o evento `erro_interno`; `senha`, `token`, `*_KEY`, `redis://:senha@…` aparecem como `[REDIGIDO]` |
| REQ-OPS-20 | Quando uma mudança é proposta, o pipeline deve falhar se o número de avisos do lint passar do teto registrado (que só pode descer) e deve auditar as dependências de produção, falhando em vulnerabilidade alta ou crítica; o Dependabot deve propor atualizações de npm, Docker e actions. | CI com `eslint --max-warnings <teto>` e `npm audit --omit=dev --audit-level=high`; `.github/dependabot.yml` com npm |

## Casos-limite

Sem Redis, cache e rate limit degradam sem pendurar a requisição (ADR-0020). Projeto ainda não está em produção (resposta do dono).

- A verificação de REQ-OPS-06 só roda quando o servidor inicia, não no `next build` (o build do Docker não tem o segredo).
- A reversão do deploy (REQ-OPS-10) troca só a imagem da aplicação; migration incompatível com a versão anterior precisa de aviso na PR.
- Até a spec que ajustar REQ-OPS-01 (Redis como dependência opcional, Constitution Art. XIII.2), `/api/health` devolve 503 quando só o Redis cai e o deploy reverte nesse caso.
- Em produção o catálogo começa vazio; o ADMIN é criado por um passo único e explícito (perfil `bootstrap` do compose de publicação).

## Interfaces

GET /api/health · docker-compose.yml · docker-compose.override.yml (desenvolvimento) · docker-compose.prod.yml · Dockerfile · scripts/deploy/deploy.sh · .github/workflows/ci.yml · instrumentation.ts.

## NFRs aplicáveis

NFR-OPS-01, NFR-OPS-02.

## Fora de escopo

Observabilidade completa (métricas, tracing).

## Perguntas abertas

Resolvidas em 2026-11-11 (`specs/008-operacao-segura`): o destino é um servidor por SSH com o compose de publicação versionado e reversão automática à imagem anterior (ADR-0019); o primeiro ADMIN é criado por `seed-admin` com `ADMIN_PASSWORD` obrigatória.

1. Quem termina o TLS no servidor? O desenho assume um proxy reverso fora do compose apontando para `127.0.0.1:3000`; confirmar quando houver servidor.
2. O deploy e a reversão ainda não foram ensaiados num servidor real (REQ-OPS-10 fica ◐ até lá).
