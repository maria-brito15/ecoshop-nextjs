# Spec de mudança: 002-aprovacao-marca

- **Trilha:** completa (comportamento novo; resolve a decisão pendente P11)
- **Capacidades afetadas:** AUTH, USR (`docs/capabilities/autenticacao`, `docs/capabilities/gestao-de-usuarios`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (G1 aprovado em 2026-11-10) · **Data:** 2026-11-10

## Problema

Hoje, quem se cadastra com `tipo: "MARCA"` recebe o papel MARCA imediatamente (`POST /api/users` → `criarUsuario` grava `tipo` como veio no corpo). Isso viola REQ-AUTH-11 (proposta do dono em 2026-11-10): o cadastro como MARCA deveria ficar pendente até um ADMIN aprovar. REQ-USR-03 (aprovar pedido de MARCA) não tem endpoint nem tela — está em backlog (P11) porque falta decidir **onde mora o status do pedido**: no `Usuario` ou na `Marca`.

## Fora de escopo

- Fluxo de rejeição explícita com notificação ao usuário (trato só a aprovação; rejeição fica como exclusão/edição manual pelo ADMIN, via painel já existente).
- Convite por e-mail ou notificação de aprovação (gestao-de-usuarios já lista isso como fora de escopo).
- Mudar a aba "Marcas" do painel além do necessário para aprovar.

## Decisão de arquitetura (P11) — recomendação

**Modelo recomendado: status na `Marca`, não no `Usuario`.**

- O `Usuario` cadastrado como MARCA é criado com `tipo: "CLIENTE"` (direitos de CLIENTE enquanto pendente, como o BR-AUTH-04 já propõe) e, junto, uma `Marca` é criada com um novo campo `status: StatusMarca` (`PENDENTE` por padrão).
- Isso exige capturar nome (e opcionalmente descrição) da marca pretendida no cadastro público, hoje ausente de `registroPublicoSchema` (`lib/schemas/user.ts:86-91`).
- ADMIN aprova: `Marca.status → APROVADA` e `Usuario.tipo → MARCA`, numa transação (`$transaction`).
- Marcas já existentes (criadas hoje pelo ADMIN direto no painel, sem esse fluxo) recebem `status: APROVADA` na migração de dados, para não regredir o comportamento atual do CRUD de marcas.

**Por que não no `Usuario`:** o `Usuario` não tem hoje nenhum dado de marca (nome, descrição) — guardar só um status lá não registra o *pedido* em si, e a aba "Marcas" do painel (`app/(admin)/painel/page.tsx`, `SecaoMarcas`) já é o lugar natural para o ADMIN ver e decidir pedidos, listando por status.

**Alternativa (rejeitada):** campo de status no `Usuario` (ex.: `statusAprovacaoMarca`) com a `Marca` só sendo criada na aprovação. Rejeitada porque duplica a modelagem de "pedido de marca" fora da entidade `Marca`, e exigiria pedir nome da marca de novo no momento da aprovação (perdendo o dado do cadastro original) ou guardá-lo solto no `Usuario`.

Isso vira ADR-0018 no plano (G2), com as alternativas acima.

## Comportamento atual (fato, com evidência)

- `lib/schemas/user.ts:86-91`: `registroPublicoSchema` aceita `tipo: "CLIENTE" | "MARCA"`, sem campo de marca.
- `services/user.service.ts:85` (`criarUsuario`): grava `tipo` exatamente como recebido — não há pendência.
- `services/brand.service.ts:107-117` (`criarMarca`): hoje só é chamada pelo ADMIN no painel, depois que o usuário já é MARCA; exige `usuario.tipo === "MARCA" || "ADMIN"`.
- `docs/capabilities/autenticacao/status.md:19`: REQ-AUTH-11 ❌.
- `docs/capabilities/gestao-de-usuarios/status.md:11`: REQ-USR-03 ❌, em backlog por P11.
- `prisma/schema.prisma:37-46`: `Marca` não tem campo de status.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-AUTH-11 | Quando alguém se cadastra como MARCA, o sistema deve criar o usuário como CLIENTE e uma `Marca` com status PENDENTE, e só conceder os direitos de MARCA após aprovação de um ADMIN. | `POST /api/users` com `tipo: "MARCA"` → 201, `Usuario.tipo === "CLIENTE"`, `Marca.status === "PENDENTE"` associada | Altera (texto já existia; comportamento muda) |
| REQ-AUTH-14 | Se o cadastro pede `tipo: "MARCA"` sem o nome da marca, o sistema deve responder 400. | `POST /api/users` com `tipo: "MARCA"` e sem `marcaNome` → 400 | Novo |
| REQ-USR-03 | Quando um ADMIN aprova uma marca pendente, o sistema deve mudar `Marca.status` para APROVADA e o `Usuario.tipo` associado para MARCA, de forma atômica. | `POST /api/marcas/[id]/aprovar` por ADMIN → 200; `Marca.status === "APROVADA"`, usuário associado passa a MARCA | Já existe na spec (❌→✅), endpoint novo e dedicado |
| REQ-USR-05 | Quando um ADMIN lista marcas, o sistema deve incluir o status (`PENDENTE`/`APROVADA`/`REJEITADA`) de cada uma. | `GET /api/marcas` por ADMIN → 200, cada item com `status` | Novo |

## Cenários e casos-limite

- Cadastro como CLIENTE (sem `marcaNome`) → comportamento atual, sem mudança (não cria `Marca`).
- ADMIN rejeita: fora de escopo nesta mudança; ADMIN pode excluir a `Marca` pendente pelo CRUD já existente (comportamento já coberto por REQ-USR-04), o que deixa o usuário como CLIENTE permanente — aceitável como "rejeição manual".
- Usuário pendente faz login: sessão é emitida com `tipo: "CLIENTE"` (direitos de CLIENTE); `/api/auth/refresh` já reemite o token se o tipo no banco mudar depois da aprovação (REQ-AUTH existente, sem alteração).
- Marcas pré-existentes no banco (seed ou criadas pelo ADMIN antes desta mudança): migração de dados define `status = APROVADA` para todas, preservando o catálogo atual.

## Regras de negócio e restrições

- BR-AUTH-04 (proposta do dono): direitos de CLIENTE enquanto pendente — confirmado por esta spec.
- ADR-0017: a decisão de acesso fica no handler, não no middleware; `PUT /api/marcas/[id]` segue o mesmo padrão dos outros handlers ADMIN.
- Constitution Art. IV: resposta de aprovação não deve incluir senha do usuário.

## Interfaces afetadas

- `POST /api/users` (corpo ganha `marcaNome`, `marcaDescricao?` quando `tipo: "MARCA"`).
- `POST /api/marcas/[id]/aprovar` (novo; dedicado à transição de status — `PUT /api/marcas/[id]` continua só editando nome/descrição/usuarioId).
- `GET /api/marcas` (resposta ganha campo `status`).
- Painel ADMIN, aba "Marcas" (`SecaoMarcas`): coluna de status + ação "Aprovar" para `PENDENTE`.
- Prisma: `enum StatusMarca { PENDENTE APROVADA REJEITADA }`, `Marca.status StatusMarca @default(PENDENTE)` + migração de dados para marcas existentes.

## Delta na spec viva

- `autenticacao/status.md`: REQ-AUTH-11 ❌→✅ (teste); novo REQ-AUTH-14.
- `gestao-de-usuarios/status.md`: REQ-USR-03 ❌→✅ (teste), sai do backlog; novo REQ-USR-05; `spec.md` ganha BR-USR-03 (transição de status é atômica).
- `docs/architecture/adr/pendentes.md`: remove a linha P11 da tabela e a linha correspondente em "Funcionalidades decididas, ainda não construídas".
- Novo ADR-0018 (modelo de aprovação de marca).

## Decisões do G1 (2026-11-10)

- Modelo de status na `Marca`: aprovado como recomendado.
- Endpoint de aprovação: dedicado (`POST /api/marcas/[id]/aprovar`), não reaproveita o `PUT` genérico.
- Rejeição: fora de escopo nesta mudança; "ADMIN exclui a marca pendente" é a forma aceita de rejeitar por ora. `REJEITADA` fica no enum sem fluxo que a produza.

## Perguntas em aberto

1. Mensagem exibida a quem se cadastra como MARCA enquanto pendente (herdada de REQ-AUTH-11) — proponho "Seu cadastro como marca parceira está em análise; por enquanto você tem acesso como cliente.", texto final a confirmar na implementação (não bloqueante).
