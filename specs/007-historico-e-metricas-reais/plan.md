# Plano: 007-historico-e-metricas-reais

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0004 (UI client-side), ADR-0011 (precedente de "sem backend quando não precisa") · **ADRs novos/que substitui:** nenhum

## Abordagem técnica

1. `app/(store)/produtos/[id]/page.tsx`: novo `useEffect` (depende de `data?.produto`) que lê `ecoshop_history`, remove qualquer entrada antiga do mesmo produto (evita duplicata ao revisitar), insere a nova no topo, corta em 50 itens, e regrava. Tudo em `try/catch` — histórico não é crítico, não pode quebrar a página se `localStorage` falhar.
2. `app/(perfil)/perfil/page.tsx`: troca o `historyCount` (só um número) por `historico: HistoricoItem[]` (a lista completa); a aba "Histórico" passa a renderizar essa lista (link para o produto, foto, nome, preço, data da visita) em vez de sempre mostrar o estado vazio; o estado vazio só aparece quando `historico.length === 0`.
3. `ImpactCard` ganha uma prop obrigatória `fonte: string`, renderizada como legenda abaixo do valor — nenhuma métrica fica sem fonte declarada (Art. XI). "Explorador Verde" declara que é contagem real; as outras duas declaram a fórmula inventada como estimativa ilustrativa.

Alternativa descartada: tabela `HistoricoVisualizacao` no Postgres, vinculada ao `usuarioId`. Rejeitada nesta mudança porque (a) o código já pressupunha `localStorage` antes desta correção — mudar para o banco seria trocar a arquitetura, não só corrigir o defeito; (b) exigiria uma decisão de dono sobre reter esse dado por quanto tempo e se usuários anônimos (sem conta) também veem histórico, o que esta mudança não foi pedida para decidir.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | parcial | sem suíte de componente no projeto (ADR-0016 só cobre API); lógica de dedup/ordem/limite verificada por simulação em Node (não é teste automatizado no repo) |
| V Camadas | sim | sim | nenhuma chamada a `lib/db`; é só `localStorage` no cliente |
| XI Sem dado inventado | sim | sim | as duas métricas com fator inventado agora declaram a fórmula e que é estimativa |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `app/(store)/produtos/[id]/page.tsx` | grava `ecoshop_history` ao visitar um produto | REQ-PERF-05 |
| `app/(perfil)/perfil/page.tsx` | lê e renderiza a lista real; `ImpactCard` ganha `fonte` | REQ-PERF-05, REQ-PERF-06 |
| `docs/capabilities/conta-e-perfil/{spec,status}.md` | REQ-PERF-05/06 ❌→◐ | REQ-PERF-05, REQ-PERF-06 |
| `docs/architecture/adr/pendentes.md` | remove a linha do backlog | — |

## Plano de verificação

Sem teste de integração (não é API) nem suíte de componente no projeto. Verificação feita por simulação em Node da função de gravação (dedup, ordem mais-recente-primeiro, corte em 50) — todas as três propriedades confirmadas. Manual pendente: abrir dois produtos diferentes, ver os dois na aba Histórico; revisitar um, confirmar que não duplica; abrir a aba Impacto e confirmar as legendas de fonte — não feito nesta sessão por falta de navegador.

## Riscos e reversão

Risco: usuário com `localStorage` cheio ou bloqueado não tem histórico — degrada para o estado vazio atual, sem erro. Reversão: remover o `useEffect` de gravação e voltar o `ImpactCard`/aba Histórico ao estado anterior (a leitura already tolera a chave ausente).

## Complexity Tracking

Sem violações.
