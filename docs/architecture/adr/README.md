# Registro de decisões arquiteturais (ADRs)

> Gerado por `node scripts/sdd/adr-index.mjs`. Não edite à mão. Modelo: [0000-template.md](0000-template.md). Pendentes: [pendentes.md](pendentes.md).
> **Inferido** = descrição do que o código mostra; não prova que houve decisão formal. ADR aceito é imutável: mudou de ideia, crie um novo que o substitui.

| ADR | Decisão | Status | Relação |
|---|---|---|---|
| [ADR-0001](0001-adotar-sdd-com-spec-viva-por-capacidade-e-specs-de-muda.md) | Adotar SDD com spec viva por capacidade e specs de mudança do Spec Kit | Aceito |  |
| [ADR-0002](0002-usar-o-github-spec-kit-com-estrutura-escrita-a-mao-ate-.md) | Usar o GitHub Spec Kit com estrutura escrita à mão até fixar uma versão | Aceito |  |
| [ADR-0003](0003-monolito-next-js-app-router-com-front-end-e-api-no-mesm.md) | Monólito Next.js (App Router) com front-end e API no mesmo deploy | Inferido |  |
| [ADR-0004](0004-ui-100-client-side-consumindo-a-propria-api-via-hooks-c.md) | UI 100% client-side consumindo a própria API via hooks com cache em memória | Inferido |  |
| [ADR-0005](0005-camadas-handler-service-prisma-organizadas-por-pasta-te.md) | Camadas handler → service → Prisma, organizadas por pasta técnica | Inferido |  |
| [ADR-0006](0006-postgresql-com-prisma-7-e-driver-adapter-pg.md) | PostgreSQL com Prisma 7 e driver adapter `pg` | Inferido |  |
| [ADR-0007](0007-sessao-stateless-jwt-hs256-em-cookie-httponly-por-7-dia.md) | Sessão stateless: JWT HS256 em cookie httpOnly por 7 dias, sem revogação | Inferido |  |
| [ADR-0008](0008-autorizacao-em-duas-camadas-middleware-por-prefixo-e-gu.md) | Autorização em duas camadas: middleware por prefixo e guard por handler | Substituído | substituído por ADR-0017 |
| [ADR-0009](0009-cache-aside-em-redis-com-invalidacao-por-prefixo-mais-c.md) | Cache-aside em Redis com invalidação por prefixo, mais cache de 30 s no cliente | Inferido |  |
| [ADR-0010](0010-redis-opcional-com-fail-open-inclusive-no-rate-limit.md) | Redis opcional com fail-open, inclusive no rate limit | Inferido |  |
| [ADR-0011](0011-fotos-de-produto-no-filesystem-local-sem-metadados-no-b.md) | Fotos de produto no filesystem local, sem metadados no banco | Inferido |  |
| [ADR-0012](0012-ia-em-duas-etapas-azure-custom-vision-classifica-e-gemi.md) | IA em duas etapas: Azure Custom Vision classifica e Gemini explica, com fallback estático | Inferido |  |
| [ADR-0013](0013-entrega-por-imagem-docker-no-ghcr-io-e-vps-via-ssh-com-.md) | Entrega por imagem Docker no ghcr.io e VPS via SSH com Compose | Inferido |  |
| [ADR-0014](0014-dominio-codigo-e-mensagens-em-portugues-termos-de-frame.md) | Domínio, código e mensagens em português; termos de framework em inglês | Inferido |  |
| [ADR-0015](0015-eslint-9-flat-config-e-prettier-no-lugar-de-next-lint.md) | ESLint 9 (flat config) e Prettier, no lugar de `next lint` | Aceito |  |
| [ADR-0016](0016-testes-com-o-runner-nativo-do-node-via-tsx-contra-postg.md) | Testes com o runner nativo do Node (via tsx) contra Postgres e Redis reais | Aceito |  |
| [ADR-0017](0017-autorizacao-decidida-no-handler-por-politica-declarada-.md) | Autorização decidida no handler por política declarada; middleware só filtra páginas e rotas só-admin | Aceito | substitui ADR-0008 |
