# Tarefas: 008-operacao-segura

- **Status:** T1–T8 implementadas em 2026-11-11, **sem commits** (o dono não os pediu). T0 não foi feita (commit do trabalho anterior); a suíte inteira **não foi executada**: não havia banco de teste disponível e o daemon do Docker estava parado. Resultado por tarefa em `docs/capabilities/operacao/status.md`.
- **Regra:** em cada tarefa o teste vem primeiro e falha; depois o código; um commit por tarefa. O `[ID]` do teste é o título `test("REQ-OPS-NN: …")`.

| # | Tarefa | REQ | Feito quando |
|---|---|---|---|
| T0 | Commitar o trabalho em andamento (specs 002–007) e rodar a suíte inteira para registrar a linha de base | — | `git status` limpo e resultado da suíte anotado em `status.md` |
| T1 | `validarJwtSecret` + `instrumentation.ts`; `.env.example` com `JWT_SECRET` vazio; passo de CI que inicia o servidor construído com segredo inválido e espera erro | REQ-OPS-06 | testes de unidade (ausente, curto, valor-exemplo, válido; só em produção) passam; passo do CI confirma que o Next aborta o início ❔ |
| T2 | Seeds sem senha embutida, com validação compartilhada de 12+ caracteres; ajuste dos testes REQ-OPS-02/03 | REQ-OPS-09 | seed e seed-admin sem a variável saem com erro antes de escrever; com ela, comportamento atual; REQ-OPS-03 continua passando |
| T3 | `docker-compose.yml` base e `docker-compose.override.yml`; atualizar `.env.example` e README | REQ-OPS-07, REQ-OPS-08 | teste estático: nenhum `:-` em segredo, sem `5432`/`6379` no base, override publica em `127.0.0.1`; passo de CI `docker compose config` falha sem as variáveis e passa com elas |
| T4 | `docker-compose.prod.yml`; job `docker` do CI publica também a imagem `migrator` e expõe a tag | REQ-OPS-11 | `docker compose -f docker-compose.prod.yml config` válido; teste estático: sem `build`, sem `seed.ts`, porta só em `127.0.0.1` |
| T5 | `scripts/deploy/deploy.sh`, job `deploy` com `ssh`/`scp` nativos e `SSH_KNOWN_HOSTS`; documentar regra de migrations compatíveis; caixa na `pull_request_template.md` | REQ-OPS-10 | teste estático da ordem (migrate → up → saúde → reversão, `set -eu`); ensaio local com imagem que falha na saúde registrado como `manual:`; REQ-OPS-10 fica ◐ até haver ensaio no servidor |
| T6 | Cabeçalhos em `next.config.ts` | REQ-OPS-12 | teste lê `headers()`; HSTS só com `NODE_ENV=production` |
| T7 | Digests nas imagens e `.github/dependabot.yml` | REQ-OPS-13 | nenhuma imagem sem digest (teste estático); dependabot cobre docker, docker-compose e github-actions; **para e pergunta se não houver Docker/rede para obter os digests** |
| T8 | ADR-0019 (substitui o 0013), emenda de REQ-OPS-02/05 e novos REQ-OPS-06..13 em `operacao/spec.md` e `status.md`, README, `sdd.config.json` se preciso | todos | `npm run sdd:check`, lint, `tsc` e suíte verdes; `impact-map --worktree` lista só OPS; drift-auditor sem pendência |

## Ordem e dependências

T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T6 e T7 não dependem das anteriores e podem ser feitas em qualquer ponto depois de T0. T4 depende de T3 (mesmo desenho de variáveis). T5 depende de T4.
