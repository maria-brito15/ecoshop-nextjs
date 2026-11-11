# Spec de mudança: 007-historico-e-metricas-reais

- **Trilha:** correção (REQ-PERF-05/06 já existiam na spec; o código lia uma chave que nunca gravava)
- **Capacidades afetadas:** PERF (`docs/capabilities/conta-e-perfil`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (feature escolhida do backlog em 2026-11-11) · **Data:** 2026-11-11

## Problema

`app/(perfil)/perfil/page.tsx` já lia a chave `localStorage.ecoshop_history` para contar produtos visitados, mas nada em todo o código a gravava — `historyCount` era sempre `0`, a aba "Histórico" sempre mostrava o estado vazio, e as métricas de "Impacto" (derivadas de `historyCount`) eram sempre zero, sem nenhuma indicação de que os fatores de conversão (50L, 0,3) eram estimativas inventadas.

## Fora de escopo

- Histórico por conta (servidor/Postgres), sincronizado entre dispositivos. O histórico é por navegador (ver "Decisão" abaixo).
- Qualquer fonte científica real de impacto ambiental (não existe no projeto; mesma decisão já tomada para REQ-CONT-02/05).
- REQ-CONT-02 e REQ-CONT-05: já estavam ✅/◐ por rotulagem (resolvidos em 2026-11-10, commit `35a75a6`); a linha do backlog que os citava junto com REQ-PERF-05/06 estava desatualizada — nenhuma mudança adicional neles aqui.

## Decisão (sem ADR: segue o padrão já implícito no código)

O histórico fica em `localStorage`, não em uma tabela nova. O código já lia dessa chave antes desta mudança (só faltava escrever); criar uma tabela de histórico no Postgres seria uma extensão de escopo não pedida, e o padrão "sem backend quando não precisa" já aparece em ADR-0004/ADR-0011. Se o dono quiser histórico por conta (sincronizado entre dispositivos) no futuro, isso é uma decisão de arquitetura nova, não esta correção.

## Comportamento atual (fato, com evidência)

- `app/(perfil)/perfil/page.tsx:464-472` (antes): lia `ecoshop_history`, mas nenhum arquivo gravava essa chave.
- `app/(store)/produtos/[id]/page.tsx`: não tinha nenhum efeito de gravação de histórico.
- As três métricas de "Impacto" (`ImpactCard`) não tinham nenhuma legenda de fonte.
- `docs/capabilities/conta-e-perfil/status.md`: REQ-PERF-05/06 ❌.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-PERF-05 | Quando o usuário visita um produto, o sistema deve registrar no histórico e mostrá-lo na aba Histórico do perfil. | Visitar 2 produtos distintos → aba Histórico mostra os 2, mais recente primeiro; revisitar um produto não duplica a entrada | Já existia (❌→◐, ver nota de verificação) |
| REQ-PERF-06 | Quando o usuário abre a aba Impacto, o sistema deve exibir métricas derivadas de dados reais do próprio usuário. | "Explorador Verde" é a contagem real do histórico; as outras duas métricas (fatores de conversão inventados) ficam rotuladas como estimativa ilustrativa, com a fórmula declarada | Já existia (❌→◐, ver nota de verificação) |

## Cenários e casos-limite

- `localStorage` indisponível (modo privado/navegador bloqueando): a gravação falha silenciosamente (try/catch); a leitura também cai para lista vazia — a página não quebra.
- Histórico com mais de 50 itens: mantém só os 50 mais recentes (limite arbitrário para não crescer sem fim; documentado no código).
- Produto sem `fotoUrl`: o item do histórico mostra o ícone 🌱, igual ao resto do site.

## Regras de negócio e restrições

- Constitution Art. XI: as duas métricas com fator inventado (50L, 0,3) ficam com a fonte declarada na própria tela, mesmo padrão de REQ-CONT-02/05.

## Interfaces afetadas

`app/(store)/produtos/[id]/page.tsx` (grava `ecoshop_history`) · `app/(perfil)/perfil/page.tsx` (lê e renderiza a lista; rotula as métricas).

## Delta na spec viva

`conta-e-perfil/status.md`: REQ-PERF-05/06 ❌→◐ (código; falta verificação manual no navegador — a lógica de histórico foi verificada por simulação em Node, não pela UI real). `conta-e-perfil/spec.md`: resolve a primeira pergunta aberta. `pendentes.md`: remove a linha do backlog.

## Perguntas em aberto

A pergunta aberta #2 da spec viva ("o usuário pode alterar o próprio e-mail e senha?") continua sem resposta, sem relação com esta mudança.
