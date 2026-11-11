# Decisões arquiteturais pendentes

Ainda **não são ADRs**: faltam decisão e dados. Cada uma vira ADR (próximo número livre) quando uma spec de mudança precisar dela. Alternativas e recomendação inicial em `docs/discovery/2026-11-baseline/06-inventario-adrs.md`.

| Código | Decisão | Depende de | Quando decidir |
|---|---|---|---|
| P02 | Política de sessão (revogação, duração) — substitui o ADR-0007 se mudar | Não há produção ainda: bom momento | Antes do primeiro deploy |
| P04 | Rate limit sem Redis (fail-open/closed/memória) | — | Antes do primeiro deploy |
| P05 | Estratégia de consistência de cache | Medição de necessidade real | Spec de catálogo |
| P06 | Escopo do modelo Azure (tags do Custom Vision) — a parte "chat com UI" foi resolvida em 2026-11-10 (`specs/004-chat-flutuante/spec.md`: botão flutuante) | Tags do Azure documentadas | Spec do EcoScan, se mudar |
| P07 | Busca de dados na UI (hooks × Server Components × biblioteca) | Decomposição das páginas | Quando as páginas forem componentizadas |
| P09 | Contrato de API (tabela na spec × OpenAPI) | Surgir consumidor externo | Sob demanda |

Resolvidas: P03 (armazenamento de mídia) foi ratificada em 2026-11-10 como ADR-0011 Aceito — mantém filesystem local. P11 (aprovação de cadastro MARCA) foi ratificada em 2026-11-10 como ADR-0018 Aceito — status fica na `Marca`.

## Funcionalidades decididas, ainda não construídas

Não são decisões de arquitetura (por isso não entram na tabela acima); são respostas do dono (`docs/discovery/2026-11-baseline/11-respostas-e-correcoes-iniciais.md`). Backlog de 2026-11-10 totalmente implementado em 2026-11-11 (aprovação de MARCA — ADR-0018; chat flutuante; galeria de fotos; filtro/ordenação do catálogo; vínculo produto↔certificado; histórico e métricas de impacto). Nenhum item pendente no momento.
