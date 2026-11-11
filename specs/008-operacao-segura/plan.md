# Plano: 008-operacao-segura

- **Status:** Implementado em 2026-11-11 (dono concedeu autonomia técnica; G2 tratado como concedido). Desvios em relação ao plano original:
  - **D1:** lançar erro em `register()` **não** impede o início (o Next só loga e o processo segue vivo; descoberto com o servidor real). Passou a ser `lib/config/verify-environment.ts`, carregado só no runtime `nodejs`, que registra o erro e chama `process.exit(1)`.
  - **D4:** o ensaio do deploy e da reversão **não foi feito** (o daemon do Docker não estava ativo e não há servidor).
  - Os testes que precisam de banco (seeds, REQ-OPS-02/03) foram escritos mas **não executados**: não havia banco de teste disponível.
- **Spec:** `spec.md` (G1 aprovado em 2026-11-11)
- **ADR:** proposto o **ADR-0019**, que ratifica e substitui o ADR-0013 (Inferido) com os detalhes de REQ-OPS-10/11. Só é criado depois do G2.

## Decisões técnicas

### D1. Recusar subir sem segredo forte (REQ-OPS-06)

- Função pura `validarJwtSecret(valor)` em `lib/config/jwt-secret.ts`: devolve a mensagem de erro, ou `null` se válido. Regras: presente, com no mínimo 32 caracteres, e sem conter (sem diferenciar maiúsculas) nenhum destes trechos de valor-exemplo: `supersecretkey`, `seu-segredo`, `mude-em`, `changeme`, `sua-chave`.
- `instrumentation.ts` na raiz: `register()` chama a função quando `NEXT_RUNTIME === "nodejs"` e `NODE_ENV === "production"`. ~~lança erro se inválido~~ **Corrigido na implementação:** registra o erro e encerra o processo com `process.exit(1)` (ver o status acima). `next build` sem `JWT_SECRET` foi verificado e passa; a guarda `NEXT_PHASE` fica como proteção extra.
- `lib/auth/jwt.ts` **não muda** (sem tocar o caminho sensível do ADR-0007). `lib/config/` é o lugar onde a spec 015 vai colocar o schema único de ambiente; esta mudança só cria o primeiro arquivo.
- `.env.example`: `JWT_SECRET=` vazio, com o comando para gerar o valor. O exemplo atual (`seu-segredo-jwt-aqui-mude-em-producao`) tem 38 caracteres e **passaria** só pela regra de tamanho; por isso a lista de trechos proibidos.
- ❔ **A confirmar na tarefa T1:** que o Next realmente aborta o servidor quando `register()` lança. A verificação é um passo no CI que inicia o servidor construído com cada segredo inválido e espera saída com erro.
- Alternativa descartada: validar dentro de `getSecret()`. Só rodaria na primeira requisição (tarde demais) e misturaria a regra com o caminho sensível.

### D2. Três arquivos de compose (REQ-OPS-07, 08, 11)

| Arquivo | Uso | Conteúdo |
|---|---|---|
| `docker-compose.yml` | base e desenvolvimento | `app` (build), `postgres`, `redis`, `migrate`, `seed` (só `seed-admin.ts`). **Sem `ports` de banco/Redis.** Segredos com `${VAR:?mensagem}`, nenhum `:-` em segredo. Redis com `--requirepass`. |
| `docker-compose.override.yml` | só desenvolvimento (o Compose o carrega sozinho) | publica `5432` e `6379` em `127.0.0.1` e adiciona `seed-demo` (`prisma/seed.ts`, com `SEED_USER_PASSWORD`). |
| `docker-compose.prod.yml` | publicação (`-f`; ignora o override) | `app` e `migrate` por **imagem do GHCR** (sem `build`), `postgres`, `redis` com senha, porta da app publicada só em `127.0.0.1:3000`, `seed-admin` em perfil `bootstrap` (não roda sozinho). |

- Variáveis obrigatórias: `JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `ADMIN_PASSWORD`, `SEED_USER_PASSWORD` (esta só no override). `DATABASE_URL` e `REDIS_URL` são montadas no compose a partir delas.
- Senhas na URL precisam ser seguras para URL: documentar a geração com `openssl rand -hex 24` ou, no Windows, `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
- O Dockerfile só gera imagem de aplicação no alvo `runner`, que **não tem o CLI do Prisma**. Por isso o CI passa a publicar também o alvo `migrator` como segunda imagem (`…-migrator`), usada pelo `migrate` do compose de produção. Hoje o `migrate` depende de ter o código-fonte no servidor.
- ❔ **Pergunta para o G2 (Q-A):** quem termina o TLS no servidor (nginx, Caddy, outro)? O plano assume um proxy **fora** do compose, apontando para `127.0.0.1:3000`. Se for outro desenho, só muda a porta publicada.

### D3. Seeds sem senha embutida (REQ-OPS-09, emenda de REQ-OPS-02)

- `prisma/seed.ts`: remove o `?? "EcoshopDemo@2026"`. Sem `SEED_USER_PASSWORD` com 12+ caracteres, sai com erro **antes** de qualquer escrita.
- `prisma/seed-admin.ts`: remove o `|| "Admin@123456"` e eleva o mínimo de 8 para 12; falha antes de abrir conexão de escrita.
- A validação é a mesma nos dois (uma função pequena compartilhada em `prisma/`), reaproveitando a de `seed-admin.ts`.
- Em produção o ADMIN é criado uma vez, a pedido: `docker compose -f docker-compose.prod.yml --profile bootstrap run --rm seed-admin`. Catálogo vazio.
- O `seed-admin.ts` hoje cria **ou atualiza** o admin. Fica como está (redefine a senha do admin pelo `.env`), mas, como no compose base ele roda a cada `up`, a nota no README avisa que ele sobrescreve a senha de `ADMIN_EMAIL` a cada subida em desenvolvimento.
- Os testes REQ-OPS-02/03 em `operations.test.ts` rodam o seed real; passam a definir `SEED_USER_PASSWORD` e ganham casos de falha sem a variável.

### D4. Deploy com ordem, saúde e reversão (REQ-OPS-10)

- `scripts/deploy/deploy.sh` (POSIX, `set -eu`), executado no servidor com `APP_TAG`:
  1. guarda a tag em uso (arquivo `.deploy/current-tag` do servidor);
  2. `pull` das imagens da app e do migrator;
  3. `run --rm migrate`; se falhar, **sai com erro sem tocar a app antiga**;
  4. `up -d --no-deps app` com a tag nova;
  5. consulta `GET http://127.0.0.1:3000/api/health` até responder 200;
  6. se não responder no prazo: sobe a tag anterior, sai com erro (o job falha);
  7. se responder: grava a tag nova e limpa imagens antigas.
- Prazo proposto: 12 tentativas a cada 5 s (60 s), alinhado ao `start_period` de 40 s do healthcheck atual. Valores sujeitos ao G2.
- Até a spec 011, `/api/health` ainda devolve 503 quando só o Redis cai. Nesse caso o deploy reverte, o que é seguro (falha para o lado conservador); a spec 011 corrige o health.
- A reversão **não desfaz migrations**. Regra documentada em `docs/guides/` e uma caixa de verificação no `.github/pull_request_template.md`: "migration compatível com a versão anterior da aplicação".
- No CI, o job `deploy` troca a action de terceiros `appleboy/ssh-action` por `scp` e `ssh` nativos do runner, com `SSH_PRIVATE_KEY` e um **segredo novo `SSH_KNOWN_HOSTS`** (verificação estrita da chave do servidor). Menos código de terceiros na cadeia de entrega. Copia `docker-compose.prod.yml` e `deploy.sh` e executa o script. O arquivo com os segredos fica só no servidor (`/opt/ecoshop/.env`), fora do repositório.
- O job `docker` passa a calcular a tag uma vez (`sha-` + 7 primeiros caracteres do commit) e a repassar ao `deploy` por `outputs`.

### D5. Cabeçalhos de segurança (REQ-OPS-12)

- `headers()` em `next.config.ts`, para todas as rotas: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Verifiquei que o código não usa `getUserMedia`, `capture` nem geolocalização, então a política restritiva não quebra o EcoScan (que envia arquivo por `<input>`).
- `Strict-Transport-Security: max-age=300` **só quando `NODE_ENV=production`**, sem `includeSubDomains` nem `preload`. O valor de 5 minutos é o início conservador usual; aumentá-lo é uma mudança futura.
- Sem CSP (decisão do dono: spec própria).

### D6. Digests e Dependabot (REQ-OPS-13)

- `FROM node:22-alpine@sha256:…` no Dockerfile (4 estágios) e `postgres`/`redis` por digest nos compose.
- **Os digests não serão inventados**: são obtidos na hora com `docker buildx imagetools inspect <tag>`. Se o ambiente não tiver Docker ou rede, a tarefa T7 para e pergunta.
- `.github/dependabot.yml` com os ecossistemas `docker`, `docker-compose` e `github-actions`. Atualizações de npm ficam para a spec 018 (evitar ruído agora).

## Impacto e riscos

- **Experiência de desenvolvimento:** o `docker compose up` passa a exigir variáveis no `.env`. Mitigação: `.env.example` completo, README com os comandos de geração, e a mensagem de erro do `${VAR:?…}` nomeia a variável que falta.
- **Caminhos sensíveis:** `lib/redis.ts`, `lib/cache/**` e `lib/auth/**` **não** são alterados; o `impact-map` deve listar só OPS. A PR cita o ADR-0019.
- **Primeiro deploy real:** os scripts de deploy e reversão só são totalmente verificáveis num servidor. Até haver ensaio, REQ-OPS-10 fica ◐ no `status.md`, com a evidência do que foi testado localmente.
- **Rollback de imagem:** protege contra falha de **aplicação**, não de dados; a regra de migrations compatíveis é a contrapartida.

## Verificação

Testes estáticos e de unidade rodam em `npm test`; as checagens que precisam de Docker ou de build rodam no CI. Cada requisito tem seu teste/passo em `tasks.md`. Ao final: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run sdd:check`, `node scripts/sdd/impact-map.mjs --worktree`.
