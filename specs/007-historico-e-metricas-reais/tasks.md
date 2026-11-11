# Tarefas: 007-historico-e-metricas-reais

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | `app/(store)/produtos/[id]/page.tsx`: grava `ecoshop_history` (dedup, mais recente primeiro, corte em 50) | REQ-PERF-05 | — | lógica verificada por simulação em Node (dedup/ordem/limite) | [x] |
| T2 | `app/(perfil)/perfil/page.tsx`: lê a lista completa; aba Histórico renderiza os itens reais | REQ-PERF-05 | T1 | código compila (`tsc`), lint sem erro novo | [x] |
| T3 | `ImpactCard` ganha `fonte`; as 3 métricas declaram a fonte (real ou estimativa ilustrativa) | REQ-PERF-06 | T2 | nenhuma métrica sem `fonte` | [x] |
| T4 | Consolidar `conta-e-perfil/{spec,status}.md`; remover linha do backlog de `pendentes.md` | — | T1–T3 | `npm run sdd:check` passa | [x] |

## Nota

REQ-PERF-05/06 ficam ◐, não ✅: a lógica central (gravação, dedup, ordem, limite) foi verificada por simulação em Node fora do React, e não há suíte de componente no projeto para testar a renderização automaticamente. Falta verificação manual no navegador (indisponível nesta sessão) para confirmar que a aba Histórico e as legendas de Impacto aparecem como esperado na tela.
