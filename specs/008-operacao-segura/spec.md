# Spec de mudança: 008-operacao-segura

- **Trilha:** correção com mudança de regra (a Constitution Art. XII e XIII já exigem o comportamento; REQ-OPS-01 e REQ-OPS-02 da spec viva precisam de emenda)
- **Capacidades afetadas:** OPS (`docs/capabilities/operacao`); toca `lib/auth/jwt.ts` (AUTH, caminho sensível ADR-0007) apenas para validar o segredo, sem mudar a decisão do ADR
- **Status:** Implementada em 2026-11-11 e consolidada em `docs/capabilities/operacao` (G1: dono seguiu as recomendações, destino serve HTTPS, catálogo vazio em produção). Pendente: executar os testes com banco e ensaiar o deploy/reversão (REQ-OPS-02/09/10 ficam ◐); G4 (revisão da PR).
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

A auditoria de 2026-11-11 encontrou, no que o repositório entrega para rodar e publicar o sistema, comportamentos que a Constitution já proíbe (Art. XII.1, XIII.2, X.2) ou que tornam a entrega não reproduzível. Quem copiar este repositório para um servidor herda esses comportamentos.

## Fora de escopo

- Sessão, revogação de token e política de senha → spec 010 (substitui ADR-0007; decisões do dono de 2026-11-11 já registradas).
- Redis, rate limit, chave de cache e **`/api/health` separando dependência obrigatória de opcional** (Art. XIII.2, emenda de REQ-OPS-01) → spec 011.
- Schema único de variáveis de ambiente para toda a aplicação (Art. XII.2) e logger (Art. XIII.1) → spec 015. Esta spec só valida `JWT_SECRET` e os segredos do compose.
- Mídia de produto, front-end, testes unitários e demais achados da auditoria → specs próprias.
- Qualquer mudança de comportamento de produto (catálogo, perfil, painel).

## Comportamento atual (fato, com evidência)

- `docker-compose.yml`, serviço `app`: `JWT_SECRET: ${JWT_SECRET:-supersecretkeychangeinproduction}` — sem a variável, a aplicação sobe com um segredo público; quem o conhece forja um token ADMIN. Viola Art. XII.1.
- `lib/auth/jwt.ts`, `getSecret()` (~linha 46): só falha se a variável estiver vazia, e só no primeiro uso; não exige tamanho mínimo nem recusa valores-exemplo.
- `docker-compose.yml`: `POSTGRES_PASSWORD: ecoshop` e `DATABASE_URL` com a mesma senha, fixos no arquivo; portas `5432` e `6379` publicadas no host; Redis sem senha.
- `prisma/seed.ts:56`: `SEED_USER_PASSWORD ?? "EcoshopDemo@2026"`, e o seed cria um usuário `ADMIN` com essa senha. O compose roda esse seed na primeira subida (`seed` é dependência de `app`). `prisma/seed-admin.ts:45`: `ADMIN_PASSWORD || "Admin@123456"`.
- `.github/workflows/ci.yml`, job `deploy`: roda `docker compose up -d --no-deps app` **antes** de `docker compose run --rm migrate`; não há teste de saúde depois do deploy nem volta à versão anterior. O mesmo script faz `docker compose pull app`, mas o serviço `app` do `docker-compose.yml` só tem `build:` (sem `image:`), então o `pull` não traz a imagem publicada no GHCR. O compose realmente usado no servidor (`/opt/ecoshop`) não está no repositório (resposta do dono: o servidor não usa este compose).
- `next.config.ts`: não define nenhum cabeçalho de segurança.
- Imagens base (`node:22-alpine`, `postgres:16-alpine`, `redis:7-alpine`) referenciadas por tag flutuante.
- `docs/capabilities/operacao/spec.md`: "Projeto ainda não está em produção (resposta do dono)".

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-OPS-06 | Quando a aplicação inicia com `NODE_ENV=production`, o sistema deve recusar iniciar se `JWT_SECRET` estiver ausente, tiver menos de 32 caracteres ou for um valor-exemplo conhecido. | Iniciar o servidor em produção com cada valor inválido → encerra com mensagem clara, sem subir. Com valor válido → sobe. | Novo (Art. XII.1) |
| REQ-OPS-07 | O arquivo `docker-compose.yml` não deve conter valor padrão utilizável para nenhum segredo (`JWT_SECRET`, senha do Postgres, senha do Redis, senha do admin e dos usuários de demonstração); a falta de qualquer um deve impedir a subida com mensagem indicando a variável. | `docker compose config` sem as variáveis → erro nomeando a variável; nenhuma ocorrência de `:-` associada a segredo. | Novo (Art. XII.1) |
| REQ-OPS-08 | O `docker-compose.yml` não deve publicar as portas do Postgres e do Redis no host por padrão; publicá-las é uma escolha explícita para desenvolvimento. | `docker compose config` base não lista `5432` nem `6379` em `ports`; o override de desenvolvimento as lista. | Novo |
| REQ-OPS-09 | Quando o seed roda, o sistema não deve usar senha embutida no código: `SEED_USER_PASSWORD` e `ADMIN_PASSWORD` passam a ser obrigatórios e o seed falha, sem gravar nada, se faltarem ou tiverem menos de 12 caracteres. Em produção só o ADMIN é criado (`seed-admin`); o seed de demonstração (usuários, marcas, produtos) roda apenas em desenvolvimento, e o catálogo de produção começa vazio. | Rodar `seed.ts` e `seed-admin.ts` sem a variável → falha antes de qualquer escrita; com ela → comportamento atual, sem apagar dados. O compose de publicação não referencia `seed.ts`. | Altera REQ-OPS-02 |
| REQ-OPS-10 | Quando o pipeline publica uma nova versão, o deploy deve aplicar as migrations **antes** de iniciar a aplicação nova, verificar a saúde da aplicação depois e, se a verificação falhar, voltar à imagem anterior e marcar o job como falho. | Script de deploy versionado, com a ordem migrate → up → verificar → (reverter); teste estático da ordem; ensaio manual de falha registrado no `status.md`. | Altera REQ-OPS-05 |
| REQ-OPS-11 | O repositório deve conter o compose usado para publicar (referenciando a imagem do GHCR por tag de commit), de forma que o deploy seja reproduzível a partir do repositório. | O job de deploy usa o arquivo versionado; `docker compose -f … config` válido. | Novo |
| REQ-OPS-12 | Quando a aplicação responde a uma requisição, o sistema deve incluir `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` restritiva; em produção deve incluir também `Strict-Transport-Security` (sem `includeSubDomains` nem `preload` nesta mudança). | Teste lê a configuração de cabeçalhos; `Strict-Transport-Security` presente com `NODE_ENV=production` e ausente fora dela. | Novo |
| REQ-OPS-13 | As imagens base do Dockerfile e do compose devem ser fixadas por digest, com atualização automática proposta por ferramenta de dependências. | Nenhuma referência de imagem sem digest; configuração do atualizador no repositório. | Novo |

## Cenários e casos-limite

- `next build` roda com `NODE_ENV=production` e, no estágio de build do Docker, sem `JWT_SECRET`: a verificação de REQ-OPS-06 **não pode** executar na importação do módulo nem no build; só quando o servidor inicia.
- Desenvolvimento local e testes (`NODE_ENV` diferente de `production`): continuam funcionando com os valores do `.env`/helpers de teste; o `.env.example` traz valores de exemplo marcados como "somente desenvolvimento".
- Migration com mudança incompatível com a versão anterior da aplicação: a volta à imagem anterior (REQ-OPS-10) **não desfaz a migration**. Regra: migrations devem ser compatíveis com a versão anterior da aplicação (adicionar antes de remover). Migration incompatível exige aviso na PR.
- Falha da própria etapa de migration no deploy: a aplicação antiga não é tocada.
- HSTS: o dono confirmou que o destino serve HTTPS. Como é difícil de desfazer, entra com validade curta, sem `includeSubDomains` e sem `preload`; aumentar a validade é uma mudança futura, depois de confirmado que todos os caminhos funcionam em HTTPS. Em HTTP o navegador ignora o cabeçalho.
- A criação do ADMIN em produção é um passo único e explícito (não roda a cada deploy), e o catálogo de produção começa vazio.

## Regras de negócio e restrições

- Constitution Art. XII.1 (sem segredo padrão; recusa iniciar em produção), X.2 (seed não destrói dados; idempotente), XIII.2 (health — fora de escopo aqui, vai na 011).
- Nenhuma credencial real entra no repositório; `.env.example` só traz espaços e valores de exemplo.
- ADR-0013 (entrega por imagem no GHCR e VPS via SSH) está com status **Inferido**, não Aceito: o plano (G2) propõe um ADR novo que o ratifica e substitui com os detalhes de REQ-OPS-10/11.

## Interfaces afetadas

`docker-compose.yml` (+ arquivo de desenvolvimento e arquivo de publicação) · `Dockerfile` · `docker-entrypoint.sh` · `.github/workflows/ci.yml` · `prisma/seed.ts` · `prisma/seed-admin.ts` · `.env.example` · `next.config.ts` · ponto de inicialização do servidor (`instrumentation.ts`, definido no plano) · `.github/dependabot.yml` · script de deploy. `lib/auth/**` (caminho sensível do ADR-0007) **não** é alterado.

## Delta na spec viva

`operacao/spec.md`: emenda de REQ-OPS-02 (senhas obrigatórias) e de REQ-OPS-05 (ordem, saúde, reversão); novos REQ-OPS-06 a 13; resolve as perguntas abertas 1 e 2 da spec viva. `operacao/status.md`: linhas novas com evidência. `README.md`: instruções de variáveis obrigatórias.

## Decisões do dono no G1 (2026-11-11)

1. Compose de publicação versionado no repositório (`docker-compose.prod.yml`, imagem do GHCR) → REQ-OPS-11.
2. O destino serve HTTPS → HSTS entra em REQ-OPS-12.
3. Content-Security-Policy fica **fora** desta spec; vira spec própria, começando em modo só-relatório (o Next injeta scripts inline e uma CSP útil exige nonce por requisição).
4. Dependabot atualiza os digests → REQ-OPS-13.
5. Produção começa com catálogo vazio e só o ADMIN → REQ-OPS-09.

## Perguntas em aberto

Nenhuma bloqueia o G1. As de implementação (quem termina o TLS, valores de tempo do deploy) estão no `plan.md` para o G2.
