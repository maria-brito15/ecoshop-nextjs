# ADR-0018: Status de aprovação de cadastro MARCA fica na `Marca`, não no `Usuario`

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (G1 de `specs/002-aprovacao-marca/spec.md` em 2026-11-10) e Claude
- Origem: nova (resolve P11 de `docs/architecture/adr/pendentes.md`)
- Capacidades: AUTH, USR

## Contexto

REQ-AUTH-11 (proposta do dono, 2026-11-10) exige que o cadastro como MARCA fique pendente até um ADMIN aprovar; REQ-USR-03 exige o endpoint de aprovação. P11 registrava que faltava decidir onde guardar esse status: no `Usuario` ou na `Marca`.

## Problema

Onde mora o status "pendente/aprovado" de um pedido de cadastro como MARCA?

## Alternativas

| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Status na `Marca` (escolhida) | `Marca` já modela nome/descrição do pedido; aba "Marcas" do painel já é o lugar natural para o ADMIN decidir | Cadastro público passa a exigir `marcaNome`; migração de dados para marcas existentes (`status = APROVADA`) | — |
| B. Status no `Usuario` (`statusAprovacaoMarca`) | Não toca no cadastro de marca | Duplica a modelagem do "pedido" fora da `Marca`; nome da marca teria que ser pedido de novo na aprovação ou guardado solto no `Usuario` | Dificulta reaproveitar a aba "Marcas" já existente no painel |

## Decisão

Opção A. `Marca` ganha `status: StatusMarca` (`PENDENTE` por padrão). O cadastro público com `tipo: "MARCA"` cria o `Usuario` como `CLIENTE` e uma `Marca` com `status: PENDENTE`. Um endpoint dedicado (`POST /api/marcas/[id]/aprovar`) muda `Marca.status → APROVADA` e `Usuario.tipo → MARCA` numa transação. `PUT /api/marcas/[id]` (edição genérica) não decide aprovação. Rejeição não tem fluxo dedicado nesta mudança: o ADMIN exclui a `Marca` pendente pelo CRUD já existente.

## Justificativa

A `Marca` já é a entidade que carrega os dados do "pedido" (nome, descrição); colocar o status nela evita uma segunda fonte de verdade e reaproveita a tela que o ADMIN já usa (`SecaoMarcas` no painel).

## Consequências

- `registroPublicoSchema` ganha `marcaNome` obrigatório (e `marcaDescricao` opcional) quando `tipo: "MARCA"` (REQ-AUTH-14).
- Migração de dados: marcas existentes recebem `status = APROVADA` para não regredir o catálogo atual.
- `criarUsuario`/rota de cadastro passam a criar `Usuario` + `Marca` juntos quando `tipo: "MARCA"` — decisão de acesso e transação ficam no serviço, chamado pelo handler (ADR-0017).
- Afeta: `prisma/schema.prisma`, `lib/schemas/usuario.ts`, `services/usuario.service.ts`, `services/marca.service.ts`, `app/api/users/route.ts`, novo `app/api/marcas/[id]/aprovar/route.ts`, `app/(admin)/painel/page.tsx` (`SecaoMarcas`).

## Verificação

Testes REQ-AUTH-11, REQ-AUTH-14, REQ-USR-03, REQ-USR-05 em `tests/integration`.
