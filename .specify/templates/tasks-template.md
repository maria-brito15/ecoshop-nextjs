# Tarefas: <NNN-nome-curto>

Regra: uma tarefa por commit; a mensagem do commit leva o ID da tarefa. Teste que falha vem antes da correção.

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | Escrever teste que falha para REQ-XXX-NN | REQ-XXX-NN | — | teste existe e falha pelo motivo certo | [ ] |
| T2 | Implementar | REQ-XXX-NN | T1 | teste de T1 passa; lint/tipos ok | [ ] |
| T3 | Consolidar spec viva e status | — | T2 | `npm run sdd:check` passa; status ✅ cita o teste | [ ] |
