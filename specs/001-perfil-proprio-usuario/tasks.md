# Tarefas: 001-perfil-proprio-usuario

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | Teste de caracterização de REQ-PERF-01 (marcado `todo` com D1) | REQ-PERF-01 | — | teste existe e falha pelo motivo certo (403 do middleware) | [x] |
| T2 | Tornar `/api/usuarios` `autenticado` no middleware | REQ-PERF-01, REQ-AUTZ-06 | T1 | `todo` removido e teste passa; AUTZ-04/05/06 continuam passando | [x] |
| T3 | Corrigir `data.mensagem` → `data.erro` na tela de perfil | REQ-PERF-04 | — | código lê `erro`; tsc e lint ok | [x] |
| T4 | Verificação manual de REQ-PERF-04 na interface | REQ-PERF-04 | T3 | `status.md` com `manual: AAAA-MM-DD …` | [ ] pendente (precisa de navegador e conta) |
| T5 | Consolidar spec viva e status | — | T2, T3 | `npm run sdd:check` passa | [x] |
