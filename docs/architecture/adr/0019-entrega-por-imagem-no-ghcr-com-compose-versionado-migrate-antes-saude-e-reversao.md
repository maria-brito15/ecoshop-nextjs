# ADR-0019: Entrega por imagem no GHCR com compose versionado; migrations antes, verificação de saúde e reversão

- Status: Aceito
- Data: 2026-11-11
- Decisores: dono do projeto (G1 da `specs/008-operacao-segura/spec.md` e autonomia técnica concedida em 2026-11-11) e Claude
- Origem: nova (ratifica e detalha o ADR-0013)
- Capacidades: OPS
- Substitui: ADR-0013

## Contexto

O ADR-0013 (Inferido) descrevia o estado do código: imagem no ghcr.io e servidor por SSH. A auditoria de 2026-11-11 mostrou que esse desenho não era reproduzível a partir do repositório: o deploy fazia `docker compose pull app` com um compose que só tinha `build:`, subia a aplicação nova **antes** de aplicar as migrations, não verificava a saúde nem sabia voltar, dependia de um compose do servidor fora do repositório e de uma action de terceiros para o SSH. O destino serve HTTPS (resposta do dono). O projeto ainda não está em produção.

## Problema

Como publicar a aplicação de forma reproduzível, sem janela de código novo com schema velho, e com volta automática à versão anterior se a nova não ficar saudável?

## Alternativas

| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Compose de publicação versionado + imagens no GHCR + script de deploy versionado, por ssh/scp nativos (escolhida) | Entrega reproduzível e testável a partir do repositório; ordem migrate → up → saúde → reversão; sem action de terceiros | Segredo novo `SSH_KNOWN_HOSTS`; duas imagens por commit (app e migrator); operação manual do servidor continua | — |
| B. Manter o compose do servidor fora do repositório e a action `appleboy/ssh-action` | Nenhuma mudança | Entrega não reproduzível nem testável; código de terceiros na cadeia de entrega | Qualquer garantia sobre a ordem do deploy |
| C. PaaS (ex.: Vercel + Postgres gerenciado) | Menos operação | Redis e filesystem de fotos a repensar (ADR-0011) | — |

## Decisão

Opção A.

- `docker-compose.prod.yml` (versionado) usa as imagens do GHCR por tag de commit (`sha-<7 caracteres>`); a imagem de migrations é a do alvo `migrator` do Dockerfile (`<tag>-migrator`), porque o alvo `runner` não tem o CLI do Prisma.
- `scripts/deploy/deploy.sh` roda no servidor: baixa as imagens, aplica as migrations (se falhar, a aplicação antiga não é tocada), sobe a aplicação, verifica `GET /api/health` por até 60 s e, se falhar, volta à tag anterior e sai com erro.
- O job de deploy do CI usa `scp` e `ssh` nativos com verificação estrita do host (`SSH_KNOWN_HOSTS`). Os segredos de execução ficam só no `.env` do servidor.
- A reversão troca só a imagem: **não desfaz migrations**. Regra: toda migration é compatível com a versão anterior da aplicação (adiciona antes de remover).
- O TLS termina num proxy reverso fora do compose, apontando para `127.0.0.1:3000`; a aplicação não é exposta diretamente.
- Produção começa com catálogo vazio; o ADMIN é criado por um passo único e explícito (perfil `bootstrap`).

## Justificativa

Aceita-se um segredo e uma imagem a mais em troca de uma entrega verificável: a ordem do deploy e a ausência de segredo padrão passam a ser checadas por testes e pelo CI, não por disciplina.

## Consequências

- Servidor precisa de `curl`, `docker compose` e do `.env` com as variáveis listadas no cabeçalho de `docker-compose.prod.yml`.
- Reversão automática cobre falha da aplicação, não de dados; uma migration incompatível exige aviso na PR (caixa no template).
- Até a spec 011, `/api/health` ainda devolve 503 quando só o Redis cai; nesse caso o deploy reverte (lado conservador).
- Afeta: `docker-compose.yml`, `docker-compose.override.yml`, `docker-compose.prod.yml`, `Dockerfile`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `scripts/deploy/deploy.sh`, `.github/pull_request_template.md`.

## Verificação

`tests/integration/operations-config.test.ts` (ordem do script, ausência de `appleboy`, `SSH_KNOWN_HOSTS`, imagem sem `build`, digests); o job do CI valida os compose. A reversão real só pode ser ensaiada num servidor: até lá REQ-OPS-10 fica ◐ no `status.md`.
