# 01 · Diagnóstico técnico do EcoShop (estado atual)

> Etapa 1 da transformação para SDD. Somente análise: nenhum arquivo do projeto foi alterado.
> Base analisada: `ecoshop-nextjs-main.zip` (111 arquivos, ~18 mil linhas, **sem histórico git** no pacote).

## Como ler este documento

Cada afirmação carrega uma etiqueta:

| Etiqueta | Significado |
|---|---|
| **[FATO]** | Verificado no código ou executado. Vem com o arquivo e a linha. |
| **[INFERÊNCIA]** | Conclusão a partir do código, ainda não executada em ambiente real. Precisa de confirmação. |
| **[RECOMENDAÇÃO]** | O que eu proporia. Decisão é sua. |
| **[DÚVIDA]** | Só você (ou quem conhece a intenção do produto) pode responder. |

### O que foi executado

| Verificação | Comando | Resultado |
|---|---|---|
| Instalação | `npm ci --ignore-scripts` | OK (next 15.5.15, prisma 7.8.0, typescript 5.9.3) |
| Tipos | `npx tsc --noEmit` | **Passa** sem erros |
| Lint | `npm run lint` (`next lint`), também com `CI=true` | **Falha (exit 1)**: não há ESLint instalado nem configurado; o comando abre o assistente interativo de configuração |
| Build | `next build --no-lint` | **Passa**; 28 rotas, middleware de 44,5 kB |
| Testes | — | **Não existem** testes, runner nem script `test` |

Não executei o app contra Postgres/Redis reais, nem as integrações Azure/Gemini. Tudo que depende disso está marcado como inferência.

---

## 1. Estrutura e organização do código

**[FATO]** Projeto Next.js 15 (App Router) monolítico, com front-end e API no mesmo deploy:

```
app/                 páginas (Route Groups) + app/api (Route Handlers REST) + _middleware/auth.ts + components/Header.tsx
config/              rotas-protegidas.ts (regras do middleware)
lib/                 ai/ auth/ cache/ hooks/ http/ schemas/ + db.ts redis.ts rate-limit.ts api.ts
services/            regras + acesso ao banco, uma por entidade (6)
types/               domain.ts, api.ts, auth.ts, ai.ts
prisma/              schema.prisma, schema.txt (cópia idêntica), 1 migration, seed.ts, seed-admin.ts
middleware.ts        Edge middleware (auth por prefixo)
Dockerfile, docker-compose.yml, docker-entrypoint.sh, .github/workflows/ci.yml
```

**[FATO]** Tamanho desigual: as páginas concentram o código de UI em arquivos únicos muito grandes (`painel/page.tsx` 1.492 linhas, `perfil/page.tsx` 1.029, `produtos/page.tsx` 920, `educacao/page.tsx` 907). Só existe **um** componente compartilhado (`app/components/Header.tsx`). Todas as páginas são `"use client"`.

**[FATO]** Há bastante comentário explicativo (JSDoc) em quase todos os arquivos. Isso ajuda a entender a intenção, mas várias dessas intenções **não batem com o código** (seção 10).

## 2. Tecnologias e dependências

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Next.js `^15.0.0` (resolvido 15.5.15), React 19 | `next lint` está depreciado nesta versão |
| Linguagem | TypeScript 5, `strict: true` | `allowJs: true` sem nenhum `.js` no projeto |
| Estilo | Tailwind CSS 4 + variáveis CSS | |
| Banco | PostgreSQL 16 via Prisma 7 + `@prisma/adapter-pg` | URL vem de `prisma.config.ts` |
| Cache / rate limit | Redis 7 (`redis` v4) | Opcional por design |
| Auth | `jose` (JWT HS256) + `bcryptjs` | Cookie `token` httpOnly |
| Validação | Zod 3 | Só no servidor |
| IA | Azure Custom Vision (REST) + Gemini `gemini-2.0-flash` (REST) | Sem SDK, via `fetch` |
| Infra | Docker multi-stage, Compose (app, postgres, redis, migrate, seed), GitHub Actions → ghcr.io → SSH | |

**[FATO]** Inconsistência de versão de Node: CI usa Node 20 (`ci.yml:31`), Dockerfile usa `node:22-alpine` (`Dockerfile:23`), README diz "Node.js 20+". Não há `.nvmrc` nem `engines`.

**[FATO]** Não há ESLint, Prettier, nenhum framework de testes nem ferramenta de cobertura em `package.json`.

## 3. Arquitetura atual (resumo; detalhe em `02-arquitetura-atual.md`)

**[FATO]** Camadas por convenção: Route Handler → (Zod schema) → Service → Prisma/Redis. Autorização em dois lugares: `middleware.ts` (por prefixo de URL) e `requireAuth/requireAdmin` dentro de cada handler.

**[FATO]** A convenção é seguida de forma parcial: `app/api/auth/*`, `app/api/users`, `app/api/auth/me` e `app/api/health` acessam `prisma` direto, sem service.

## 4. Modelagem de dados e persistência

**[FATO]** `prisma/schema.prisma`: `Usuario` (enum `TipoUsuario` ADMIN/CLIENTE/MARCA), `Categoria`, `Marca` (1:1 obrigatório com `Usuario`), `Certificado`, `Produto` (N:1 Categoria e Marca, `preco Decimal(10,2)`, `fotoUrl` opcional), `ProdutoCertificado` (junção explícita). Todas as FKs com `ON DELETE RESTRICT` (`migration.sql:84-96`).

**[FATO]** Fotos de produto **não estão no banco**: ficam no sistema de arquivos em `public/data_fotos/`, associadas por prefixo de nome `"{produtoId}_"` (`services/foto.service.ts`). O campo `Produto.fotoUrl` é independente e é o único que as páginas exibem (`app/page.tsx:106`, `produtos/page.tsx:108`, `produtos/[id]/page.tsx:253`). Ou seja, existem dois modelos de "foto" que não se conversam.

**[FATO]** Não há API para associar certificados a produtos. `ProdutoCertificado` só é preenchido pelo seed.

**[FATO]** Não há modelo de pedido, carrinho, estoque, pagamento ou endereço. Apesar de o README chamar o projeto de "e-commerce", **não existe fluxo de compra**. [DÚVIDA] É intencional (vitrine/catálogo) ou é um escopo ainda não implementado?

**[FATO]** `prisma/schema.txt` é uma cópia idêntica de `schema.prisma` (verificado com `diff`). Fonte de drift garantida.

**[FATO]** `.gitignore:70` ignora `*.sql`. A migration `prisma/migrations/.../migration.sql` está no pacote, mas qualquer migration nova **não seria versionada** sem `git add -f`. [INFERÊNCIA] Risco alto de ambientes com schema divergente.

## 5. APIs, integrações e contratos

**[FATO]** 17 Route Handlers REST. Contrato de erro padronizado `{ erro, detalhes? }` em `lib/http/responses.ts`, mas aplicado de forma parcial (ex.: `/api/auth/me` devolve `{ usuario: null }` com 401). Não há OpenAPI nem documentação de contrato além da tabela do README.

**[FATO]** Tipos de resposta do cliente em `types/api.ts` são escritos à mão e não derivam dos schemas Zod nem do Prisma. Exemplo de drift já existente: `types/domain.ts:51` declara `preco: number`, mas o Prisma serializa `Decimal` como string em JSON; as páginas compensam com `Number(p.preco)`.

**[FATO]** Integrações externas:
- Azure Custom Vision: `lib/ai/providers/azure-vision.ts`, falha silenciosa devolvendo `null`.
- Gemini: `lib/ai/providers/gemini-chat.ts`, chave passada na **query string** da URL. O `fetch` **não tem try/catch nem timeout** (linha 73).
- O chat (`app/api/ia/chat/route.ts`) reimplementa a chamada ao Gemini em vez de usar o provider.

## 6. Fluxos principais (o que de fato funciona)

| Fluxo | Situação | Evidência |
|---|---|---|
| Catálogo com busca por nome, filtro por categoria e paginação | **Funciona** (servidor) | `services/produto.service.ts` |
| Filtro por preço e ordenação | Feito **no cliente sobre a página atual** (12 itens), não sobre o catálogo | `produtos/page.tsx:270-285` |
| Filtro por marca | **Não existe** (README diz que existe) | grep `marcaId` só no painel |
| Detalhe do produto + certificados | Funciona | `produtos/[id]/page.tsx` |
| "Impacto positivo" do produto | Números **calculados a partir do preço** (`co2 = preco*0.012`, `água = preco*0.8`) | `produtos/[id]/page.tsx:97-100` |
| Login / cadastro / logout | Funciona com rate limit | `api/auth`, `api/users` |
| Perfil (ver e editar) | **Quebrado para não-admin** (ver 10.1) | `middleware.ts` + `perfil/page.tsx:486` |
| Histórico de produtos vistos no perfil | **Nunca é gravado**: `ecoshop_history` só é lido | único uso em `perfil/page.tsx:467` |
| EcoScan (foto → material → análise) | Funciona se Azure e Gemini responderem | `lib/ai/analisar-imagem.ts` |
| Chat de sustentabilidade | **Endpoint sem UI** (`useChat` não é usado) e **sem autenticação** | `api/ia/chat/route.ts:51` |
| Painel admin: produtos, categorias, marcas, certificados, fotos | Funciona | `painel/page.tsx:66` |
| Painel admin: gestão de usuários | **Não existe na UI** (só API). README diz que existe | `painel/page.tsx:66` (`type Aba` sem usuários) |
| Papel MARCA | Pode se cadastrar sozinho, mas **não tem nenhuma capacidade própria** e não ganha registro `Marca` | `lib/schemas/usuario.ts:91`, `types/auth.ts:34` |

## 7. Testes e estratégia de qualidade

**[FATO]** Nenhum teste. A única barreira de qualidade é `tsc` e `next build` no CI. O lint, que deveria ser a primeira barreira, **falha** (ver tabela inicial).

**[INFERÊNCIA]** Como o job `lint-and-build` falha no passo de lint, os jobs `docker` e `deploy` (que dependem dele, `ci.yml:74,122`) **nunca chegam a rodar**. [DÚVIDA] Você tem acesso aos logs do Actions para confirmar? O badge do README aponta para `seu-usuario/ecoshop`.

## 8. Configuração, infraestrutura e pipeline

**[FATO]** Compose sobe `postgres`, `redis`, `migrate`, `seed` e `app`; `app` depende de `seed` concluído (`docker-compose.yml:64-65`).

**[FATO]** `prisma/seed.ts:74-75` apaga **todos os produtos e vínculos de certificado** antes de recriar. Combinado com o item anterior: [INFERÊNCIA] **todo `docker compose up` apaga os produtos cadastrados pelo admin**. O deploy por CI usa `--no-deps` e escapa disso, mas qualquer `up` manual no servidor não.

**[FATO]** Credenciais do README (`admin@ecoshop.com / Admin@123456`, `cliente@ecoshop.com / Senha@123`, `README.md:451-452`) **não existem no seed usado pelo Compose**. O `seed.ts` cria `admin@ecoplace.com` etc. com senha literal `"hash-seguro-aqui"` (não é hash bcrypt, linha 177). O `seed-admin.ts` (que usa as variáveis `ADMIN_*`) **não é chamado em lugar nenhum** do Compose. [INFERÊNCIA] Num ambiente novo via Docker, ninguém consegue logar.

**[FATO]** `JWT_SECRET` tem valor padrão `supersecretkeychangeinproduction` no Compose (linha 41), e Postgres/Redis expõem portas para o host.

**[FATO]** `docker-entrypoint.sh` fixa os hosts `postgres` e `redis` no código, acoplando a imagem ao Compose.

**[INFERÊNCIA]** Fotos enviadas em runtime para `public/data_fotos` podem não ser servidas pelo Next.js em produção, porque o Next serve apenas o que estava em `public/` no build. Precisa de teste em container.

## 9. Documentação existente

**[FATO]** README PT e EN (620 linhas cada, espelhados), muito detalhados, mais um conjunto de prints. Não há ADRs, specs, CONTRIBUTING, CHANGELOG nem documentação de contrato de API.

**[FATO]** O README funciona como "marketing técnico" e descreve intenção, não comportamento verificado. A seção 10 lista onde ele diverge do código.

## 10. Débitos, inconsistências e riscos (priorizados)

### 10.1 Defeitos de comportamento (corrigir, via spec)

| # | Achado | Evidência | Impacto |
|---|---|---|---|
| D1 | **Perfil inacessível para CLIENTE/MARCA.** O middleware exige ADMIN em todo `/api/usuarios/*`, mas o handler `GET/PUT /api/usuarios/[id]` foi escrito para permitir o próprio usuário, e a página de perfil o chama | `config/rotas-protegidas.ts:95-99`, `middleware.ts:124`, `api/usuarios/[id]/route.ts:55,91`, `perfil/page.tsx:486,526` | Funcionalidade central quebrada [INFERÊNCIA forte: comportamento do middleware é determinístico] |
| D2 | `PUT /api/usuarios/[id]` devolve o objeto completo, **incluindo o hash da senha** | `services/usuario.service.ts:160-172` | Vazamento de dado sensível |
| D3 | Chat de IA **sem autenticação** e sem rate limit; consome a cota do Gemini de quem hospeda | `api/ia/chat/route.ts:51` | Custo e abuso |
| D4 | Falha de rede no Gemini derruba o scan com 500, em vez de usar o fallback que o README promete | `gemini-chat.ts:73` sem try/catch | Degradação graciosa só parcial |
| D5 | Seed destrutivo roda em todo `compose up` | `seed.ts:74-75`, `docker-compose.yml:64` | Perda de dados |
| D6 | Nenhum usuário consegue logar em ambiente Docker novo | `seed.ts:177`, README 451 | Onboarding quebrado |
| D7 | Excluir categoria/marca/certificado/usuário com vínculos gera **500** (FK RESTRICT não tratada) | `migration.sql:84-96`, services | Erro genérico para o admin |
| D8 | Erro na edição do perfil lê `data.mensagem`, mas a API devolve `erro` | `perfil/page.tsx` (handleSalvar) | Mensagem de erro sempre genérica |
| D9 | `page`/`size` sem validação (`size=100000`, `page=abc`), chave de cache derivada da query crua | `produto.service.ts:57-58` | Carga e explosão de chaves |
| D10 | CI falha no lint; deploy não roda | seção 7 | Pipeline inoperante [INFERÊNCIA] |

### 10.2 Riscos de segurança (decidir, via ADR)

- JWT de 7 dias **não revogável**: usuário rebaixado ou excluído mantém acesso até expirar; o `/api/auth/refresh` só reemite o token se o tipo mudou e depende do Header chamar (`Header.tsx:88`).
- Rate limit por `x-forwarded-for` (`rate-limit.ts:101`) pode ser falsificado se não houver proxy confiável na frente.
- Cadastro público permite escolher `tipo: MARCA` (`schemas/usuario.ts:91`). [DÚVIDA] Isso é regra de negócio desejada?
- Chave do Gemini em query string (aparece em logs de proxy).
- Upload valida extensão do nome, não o conteúdo (`foto.service.ts`); scan valida MIME declarado. Limites diferentes (5 MB vs 10 MB).

### 10.3 Débitos estruturais

- Duas camadas de cache sobrepostas (`lib/redis.ts` com helpers + `lib/cache/*` com `CacheProvider`), alias `redisDel` "deprecated" ainda exportado, chave `chaveFotosProduto` definida e nunca usada.
- Invalidação incompleta: alterar uma marca não invalida `produtos:*` (que embutem o nome da marca); `buscarMarca` embute `produtos` e não é invalidado quando produtos mudam. Dados velhos por até 3–5 min.
- Tratamento de erro Prisma por `err.message.includes("P2025")` e por `throw new Error("P2025")` manual nos services: frágil e implícito.
- Páginas gigantes sem componentes; difícil testar e especificar por partes.
- Tipos de API escritos à mão, sem ligação com Zod.
- `tsconfig.seed.json` inclui só `seed.ts`; `schema.txt` duplicado.

### 10.4 Conteúdo sem fonte (decidir, via requisito)

- Métricas fixas na home: "2k+ produtos", "98% satisfação", "0 CO₂ entregas neutras" (`app/page.tsx:234-236`). O seed tem ~20 produtos.
- "Impacto positivo" do produto calculado do preço (D-tabela seção 6).

[RECOMENDAÇÃO] Esses números são **requisitos de conteúdo sem fonte**. Em SDD, ou ganham uma regra de negócio com fonte declarada, ou saem / passam a ser rotulados como ilustrativos.

## 11. Matriz "existe × documentado × deveria estar × corrigir × decisão não formalizada"

| Tema | Existe no código | Documentado | Deveria estar documentado | Precisa de correção | Decisão não formalizada |
|---|---|---|---|---|---|
| Autorização (middleware + handler) | Sim, em 2 camadas divergentes | README (parcialmente errado) | Matriz papel × recurso × ação | D1, D3 | ADR: onde mora a autorização |
| Papel MARCA | Só enum e cadastro | Comentário em `types/auth.ts:34` promete "próprios produtos" | Requisitos do papel | Sim, ou remover | Sim |
| JWT stateless 7d | Sim | README | Política de sessão e revogação | Avaliar | ADR inferido |
| Cache Redis + cliente | Sim | README (com exageros) | Política de consistência por recurso | Invalidação incompleta | ADR inferido |
| Fotos em filesystem | Sim | README parcial | Modelo de mídia | Galeria não exibida; fotoUrl desconectado | ADR pendente |
| Fluxo EcoScan | Sim | README | Spec com limiares, erros, fallback | D4 | ADR inferido (Azure+Gemini) |
| Chat IA | Só API | README como feature | Decidir se existe | D3 | — |
| Seeds | 2 scripts divergentes | README errado | Política de dados de dev/prod | D5, D6 | — |
| Pipeline CI/CD | Sim | README | Gates de qualidade | D10 | ADR inferido (VPS + SSH) |
| Testes | Não | — | Estratégia de testes | Criar | ADR pendente |
| Compra/pedido | Não | Implícito em "e-commerce" | Escopo do produto | — | **[DÚVIDA]** |

## 12. Dúvidas que bloqueiam decisões (para você validar)

1. O EcoShop é uma **vitrine/catálogo educativo** ou um **e-commerce** que terá carrinho e pedido? Isso muda o product overview inteiro.
2. Qual é a intenção do papel **MARCA**? (gerenciar os próprios produtos? só exibição?) Ele pode ser autoatribuído no cadastro?
3. O **chat de IA** é uma feature a manter (e ganhar UI) ou pode ser removido da API?
4. As **métricas de impacto** (home e produto) têm alguma fonte, ou são ilustrativas?
5. O projeto está **em produção** em algum VPS? Há dados reais que o seed destrutivo poderia apagar?
6. Há logs do GitHub Actions confirmando se o CI passa hoje?
7. Existe um repositório git com histórico? Ele ajudaria a datar as decisões inferidas (ADRs históricos).
8. O modelo do Azure Custom Vision (tags, inclusive `outros`) está documentado em algum lugar? É um artefato externo de que a spec do EcoScan depende.
