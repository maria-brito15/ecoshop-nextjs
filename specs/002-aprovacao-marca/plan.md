# Plano: 002-aprovacao-marca

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0017 (decisão de acesso no handler) · **ADRs novos/que substitui:** ADR-0018 (novo)

## Abordagem técnica

1. **Schema:** `prisma/schema.prisma` ganha `enum StatusMarca { PENDENTE APROVADA REJEITADA }` e `Marca.status StatusMarca @default(PENDENTE)`. Migração inclui um passo de dados: `UPDATE marcas SET status = 'APROVADA'` para linhas existentes (preserva o catálogo atual — nenhuma marca já cadastrada deve virar pendente retroativamente).
2. **Cadastro público:** `registroPublicoSchema` (`lib/schemas/user.ts`) ganha `marcaNome` (obrigatório quando `tipo === "MARCA"`, via `.superRefine`) e `marcaDescricao` opcional.
3. **Serviço:** `criarUsuario` (`services/user.service.ts`) recebe `marcaNome`/`marcaDescricao` opcionais; quando `tipo === "MARCA"`, grava o `Usuario` com `tipo: "CLIENTE"` (não o valor pedido) e cria a `Marca` associada com `status: "PENDENTE"`, numa `prisma.$transaction`. Isso é uma função nova e pequena (`criarUsuarioComPedidoDeMarca` ou um branch dentro de `criarUsuario` — decido no código pelo que ficar mais simples) para não misturar com o caminho CLIENTE comum.
4. **`criarMarca` (fluxo ADMIN existente, painel):** continua exigindo `usuario.tipo === "MARCA" || "ADMIN"` (REQ-REF-04, inalterado) e cria com `status: "APROVADA"` direto — esse caminho não passa pela pendência, pois o ADMIN já está decidindo na hora de criar.
5. **Aprovação:** novo `services/brand.service.ts::aprovarMarca(id)`: busca a `Marca`, confirma `status === "PENDENTE"` (senão erro `MARCA_NAO_PENDENTE`), e faz `$transaction` com `marca.update({status: "APROVADA"})` + `usuario.update({tipo: "MARCA"})`. Invalida cache de marcas e usuários.
6. **Rota:** `app/api/marcas/[id]/aprovar/route.ts`, `POST`, `requireAdmin`, chama `aprovarMarca`. 404 se marca não existe, 409 se já não está pendente.
7. **`GET /api/marcas` e `GET /api/marcas/[id]`:** já devolvem a entidade inteira (`include`), então `status` aparece sem mudança de código — só precisa confirmar no teste.
8. **Painel:** `SecaoMarcas` (`app/(admin)/painel/page.tsx`) ganha coluna "Status" na tabela e um botão "Aprovar" quando `status === "PENDENTE"`, usando um novo hook `useAprovarMarca` ao lado dos hooks existentes em `lib/hooks/useBrands.ts`.
9. **Mensagem de pendência:** `app/(auth)/sign-in/page.tsx` já tem um checkbox "Sou uma Loja / Parceiro" (`form.isLoja`), mas o corpo enviado a `POST /api/users` hoje **não inclui `tipo`** nem nome de marca — achado durante o plano (drift não coberto por REQ ainda, fica registrado aqui em vez de decidir sozinho): o checkbox não faz nada hoje. Esta mudança corrige isso como parte de entregar REQ-AUTH-11 de ponta a ponta: quando `isLoja` está marcado, mostra um campo "Nome da marca" (obrigatório) e envia `tipo: "MARCA"` + `marcaNome` no corpo; a resposta (`marcaPendente: true`) troca a tela para a mensagem de pendência em vez de redirecionar para `/`.

Alternativa descartada: pedir `marcaNome` só na aprovação (ADMIN digita o nome). Rejeitada porque quem conhece o nome da marca é quem se cadastra, não o ADMIN.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | sim | REQ-AUTH-11/14, REQ-USR-03/05 com teste novo |
| III Autorização | sim | sim | `requireAdmin` na rota de aprovação (ADR-0017) |
| IV Dado sensível | sim | sim | resposta de aprovação usa `USUARIO_PUBLICO`, sem senha |
| V Camadas | sim | sim | handler chama `services/`; transação fica no serviço |
| VII Erros | sim | sim | 404 (marca inexistente), 409 (já não pendente), 400 (sem `marcaNome`) mapeados, não 500 |
| XI Sem dado inventado | sim | sim | mensagem de pendência fica como texto a confirmar (marcado na spec), não tratada como fato |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `prisma/schema.prisma` | `enum StatusMarca`; `Marca.status` | REQ-AUTH-11, REQ-USR-03 |
| nova migração Prisma | `status` + backfill `APROVADA` em linhas existentes | REQ-AUTH-11 |
| `lib/schemas/user.ts` | `registroPublicoSchema`: `marcaNome`/`marcaDescricao` + `superRefine` | REQ-AUTH-14 |
| `services/user.service.ts` | `criarUsuario` cria `Marca` pendente quando `tipo === "MARCA"` | REQ-AUTH-11 |
| `services/brand.service.ts` | novo `aprovarMarca(id)` | REQ-USR-03 |
| `app/api/users/route.ts` | repassa `marcaNome`/`marcaDescricao`; resposta sinaliza pendência | REQ-AUTH-11, REQ-AUTH-14 |
| `app/api/marcas/[id]/aprovar/route.ts` (novo) | `POST`, `requireAdmin`, chama `aprovarMarca` | REQ-USR-03 |
| `lib/hooks/useBrands.ts` | novo `useAprovarMarca` | REQ-USR-05 |
| `app/(admin)/painel/page.tsx` (`SecaoMarcas`) | coluna status + botão Aprovar | REQ-USR-05 |
| `app/(auth)/sign-in/page.tsx` | corrige envio de `tipo`/`marcaNome` quando `isLoja`; mensagem de pendência | REQ-AUTH-11 |
| `tests/integration/authentication.test.ts` | testes REQ-AUTH-11, REQ-AUTH-14 | REQ-AUTH-11, REQ-AUTH-14 |
| `tests/integration/users.test.ts` | testes REQ-USR-03, REQ-USR-05 | REQ-USR-03, REQ-USR-05 |
| `docs/capabilities/autenticacao/status.md` | status | REQ-AUTH-11, REQ-AUTH-14 |
| `docs/capabilities/gestao-de-usuarios/status.md` e `spec.md` | status + BR-USR-03 | REQ-USR-03, REQ-USR-05 |
| `docs/architecture/adr/pendentes.md` | remove P11 e a linha de backlog correspondente | — |
| `docs/architecture/adr/README.md` | adiciona ADR-0018 ao índice | — |

## Plano de verificação

Integração: REQ-AUTH-11 (cadastro MARCA → `Usuario.tipo === "CLIENTE"`, `Marca.status === "PENDENTE"`), REQ-AUTH-14 (sem `marcaNome` → 400), REQ-USR-03 (aprovar → `Usuario.tipo === "MARCA"`, `Marca.status === "APROVADA"`; aprovar de novo → 409), REQ-USR-05 (`GET /api/marcas` inclui `status`). Unitário/serviço: `criarMarca` continua rejeitando usuário CLIENTE fora do fluxo de pendência (REQ-REF-04 não regride). Manual: cadastrar como MARCA pela tela, ver mensagem de pendência; aprovar pelo painel e confirmar login seguinte já com tipo MARCA (via `/api/auth/refresh`).

## Riscos e reversão

Risco: marcas existentes virarem `PENDENTE` por engano na migração e "desaparecerem" de fluxos que assumam aprovação implícita (hoje nenhum endpoint filtra por status, mas o painel pode passar a esconder pendentes de alguma lista futura). Mitigação: o backfill da migração é explícito e testado antes do deploy; nenhuma listagem pública (`GET /api/marcas`, catálogo) filtra por `status` nesta mudança — só o painel ADMIN exibe a coluna. Risco: transação de aprovação falhar pela metade. Mitigação: `prisma.$transaction` garante atomicidade. Reversão: `migration down` remove a coluna/enum; `aprovarMarca` e a rota nova podem ser removidas sem afetar o resto porque nada mais as referencia ainda.

## Complexity Tracking

Sem violações. A ramificação em `criarUsuario` para `tipo === "MARCA"` é a única lógica condicional nova de peso; mantém-se no serviço (ADR-0017/Art. V).
