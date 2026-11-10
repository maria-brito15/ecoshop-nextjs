# Spec de mudança: 001-perfil-proprio-usuario

- **Trilha:** correção (o código viola REQ-PERF-01 e REQ-AUTZ-05; a regra não muda)
- **Capacidades afetadas:** PERF, AUTZ (`docs/capabilities/conta-e-perfil`, `docs/capabilities/autorizacao`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (aprovação geral da execução do roadmap em 2026-11-10; G1 registrado em `docs/learning/`) · **Data:** 2026-11-10

## Problema
Um CLIENTE ou MARCA logado abre `/perfil` e a página não carrega os próprios dados, nem consegue salvar alterações: o middleware responde 403 a `/api/usuarios/{id}`, rota que a página usa. O handler já permitia "o próprio usuário ou ADMIN", mas nunca era alcançado. Além disso, quando o salvamento falha, a tela mostra sempre "Erro ao salvar." porque lê um campo que a API não envia.

## Fora de escopo
- Histórico de produtos vistos e métricas de impacto (REQ-PERF-05, REQ-PERF-06: dependem de decisão do dono).
- Política de "negar por padrão" (REQ-AUTZ-07).
- Mudar quem pode listar, criar ou excluir usuários.

## Comportamento atual (fato, com evidência)
- `config/rotas-protegidas.ts`: `/api/usuarios` com `nivel: "admin"` → middleware nega CLIENTE/MARCA com 403 (`middleware.ts:86-89`).
- `app/api/usuarios/[id]/route.ts`: o handler já aplica "próprio ou ADMIN" (REQ-AUTZ-05, coberto por teste).
- `app/(perfil)/perfil/page.tsx:537`: `data.mensagem ?? "Erro ao salvar."`; a API responde `{ erro }`.
- Teste de caracterização `REQ-PERF-01` marcado `todo` (D1).

## Requisitos
| ID | Requisito | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-PERF-01 | Quando um usuário autenticado acessa o próprio perfil, o sistema deve exibir nome, e-mail, telefone e tipo. | Middleware libera `/api/usuarios/{id}` com cookie de CLIENTE e o handler responde 200 sem senha | Já existe (❌→✅) |
| REQ-AUTZ-06 | O middleware deve exigir sessão em `/perfil` e `/api/usuarios` (e ADMIN em `/painel`). | 401 sem cookie em `/api/usuarios/1`; `/painel` com CLIENTE redireciona | Altera (texto já descrevia sessão; o código exigia ADMIN) |
| REQ-PERF-04 | Se a edição do perfil falha, o sistema deve mostrar a mensagem de erro devolvida pela API. | Resposta `{ erro: "X" }` → a tela exibe "X" | Já existe (corrigido no código) |

## Cenários e casos-limite
- CLIENTE A pede o perfil de B → 403 vindo do handler (continua negado).
- CLIENTE lista `/api/usuarios` → 403 vindo do handler (REQ-AUTZ-04).
- Sem cookie → 401 do middleware.

## Regras de negócio e restrições
- ADR-0017: o middleware autentica; o handler decide por recurso.
- Constitution Art. III (autorização) e IV (dado sensível: nenhuma resposta com `senha`).

## Interfaces afetadas
`GET/PUT /api/usuarios/[id]` (acesso do próprio usuário) · página `/perfil`.

## Delta na spec viva
`conta-e-perfil/status.md`: REQ-PERF-01 ❌→✅ (teste); REQ-PERF-04 permanece ◐ até verificação manual na tela. `autorizacao`: nenhuma mudança de texto.

## Perguntas em aberto
- Nenhuma bloqueante. Verificação manual de REQ-PERF-04 na interface fica pendente (exige navegador e uma conta).
