# Tarefas: 002-aprovacao-marca

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | Migração Prisma: `enum StatusMarca`, `Marca.status @default(PENDENTE)`, backfill `APROVADA` nas linhas existentes | REQ-AUTH-11, REQ-USR-03 | — | `npx prisma migrate dev` roda limpo; marcas do seed ficam `APROVADA` | [x] (migração escrita à mão e aplicada com `prisma migrate deploy`: sem Postgres acessível para `migrate dev` gerar o diff) |
| T2 | Teste falhando: REQ-AUTH-11 (cadastro MARCA → `Usuario.tipo=CLIENTE`, `Marca.status=PENDENTE`) e REQ-AUTH-14 (sem `marcaNome` → 400) em `tests/integration/autenticacao.test.ts` | REQ-AUTH-11, REQ-AUTH-14 | T1 | testes existem e falham pelo motivo certo | [x] |
| T3 | `registroPublicoSchema`: `marcaNome`/`marcaDescricao` + `superRefine` exigindo `marcaNome` quando `tipo === "MARCA"` | REQ-AUTH-14 | T2 | T2 (parte 400) passa | [x] |
| T4 | `criarUsuario`: ao `tipo === "MARCA"`, grava `Usuario` como `CLIENTE` e cria `Marca` `PENDENTE` numa transação | REQ-AUTH-11 | T3 | T2 (parte pendência) passa | [x] |
| T5 | `app/api/users/route.ts`: repassa `marcaNome`/`marcaDescricao`; resposta inclui `marcaPendente: true` quando aplicável | REQ-AUTH-11 | T4 | teste de integração da rota passa | [x] |
| T6 | Teste falhando: REQ-USR-03 (aprovar marca pendente muda `Usuario.tipo` e `Marca.status`; aprovar de novo → 409) e REQ-USR-05 (`GET /api/marcas` inclui `status`) em `tests/integration/usuarios.test.ts` | REQ-USR-03, REQ-USR-05 | T1 | testes existem e falham pelo motivo certo | [x] |
| T7 | `services/marca.service.ts::aprovarMarca(id)` (transação `Marca.status→APROVADA` + `Usuario.tipo→MARCA`; erro `MARCA_NAO_PENDENTE` se já não pendente) | REQ-USR-03 | T6 | parte "aprovar" de T6 passa | [x] |
| T8 | `app/api/marcas/[id]/aprovar/route.ts` (`POST`, `requireAdmin`, mapeia 404/409) | REQ-USR-03 | T7 | T6 passa completo | [x] |
| T9 | Confirmar que `criarMarca` (fluxo ADMIN/painel) continua exigindo `tipo MARCA/ADMIN` e cria com `status APROVADA` — teste de não regressão de REQ-REF-04 | REQ-REF-04 | T1 | teste existente de REQ-REF-04 continua passando sem alteração de comportamento | [x] |
| T10 | `useAprovarMarca` em `lib/hooks/useMarcas.ts` | REQ-USR-05 | T8 | hook chama `POST .../aprovar` e invalida a listagem | [x] |
| T11 | `SecaoMarcas` no painel: coluna "Status" + botão "Aprovar" quando `PENDENTE` | REQ-USR-05 | T10 | manual: ADMIN vê e aprova uma marca pendente pela UI | [x] código + fluxo ponta a ponta verificado via `curl` contra o dev server (sem ferramenta de navegador neste ambiente); **não verificado visualmente na tela do painel** |
| T12 | `app/(auth)/sign-in/page.tsx`: corrige envio de `tipo`/`marcaNome` quando `isLoja`; campo "Nome da marca"; mensagem de pendência ao receber `marcaPendente: true` | REQ-AUTH-11 | T5 | manual: cadastro como loja mostra a mensagem e não redireciona para `/` | [x] código + `POST /api/users` verificado via `curl` (`marcaPendente: true`); **tela de cadastro não verificada visualmente** |
| T13 | Consolidar `autenticacao/status.md`, `gestao-de-usuarios/{spec,status}.md`; remover P11 de `pendentes.md`; adicionar ADR-0018 ao `adr/README.md` | — | T2–T12 | `npm run sdd:check` passa | [x] |
| T14 | Verificação final: lint, `tsc --noEmit`, `npm test` | — | T13 | todos passam | [x] `npm test` com 2 falhas pré-existentes e sem relação (REQ-SCAN-05 defeito conhecido D4; REQ-OPS-02 por dado obsoleto no banco local — ver nota abaixo) |

## Nota sobre T14

`REQ-OPS-02` falhou neste ambiente porque o `admin@ecoplace.com` já existia no banco local desde 2026-04-26 (hash placeholder, de antes da correção D6 de `prisma/seed.ts`), e o `upsert` do seed não atualiza usuários já existentes. Não é uma regressão desta mudança: nenhum arquivo de autenticação/seed de usuário foi tocado por `002-aprovacao-marca` além da linha `status: "APROVADA"` em `prisma/seed.ts` (marcas do seed, não usuários). `REQ-SCAN-05` é o defeito conhecido D4, já documentado antes desta mudança.
