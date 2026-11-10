# Decisões arquiteturais pendentes

Ainda **não são ADRs**: faltam decisão e dados. Cada uma vira ADR (próximo número livre) quando uma spec de mudança precisar dela. Alternativas e recomendação inicial em `docs/discovery/2026-11-baseline/06-inventario-adrs.md`.

| Código | Decisão | Depende de | Quando decidir |
|---|---|---|---|
| P02 | Política de sessão (revogação, duração) — substitui o ADR-0007 se mudar | Não há produção ainda: bom momento | Antes do primeiro deploy |
| P03 | Armazenamento de mídia (substitui o ADR-0011 se mudar) | Capacidade MIDIA | Spec de galeria |
| P04 | Rate limit sem Redis (fail-open/closed/memória) | — | Antes do primeiro deploy |
| P05 | Estratégia de consistência de cache | Medição de necessidade real | Spec de catálogo |
| P06 | Escopo e forma da IA (modelo Azure, chat com UI) | Tags do Azure documentadas; spec do chat | Spec do chat/UI |
| P07 | Busca de dados na UI (hooks × Server Components × biblioteca) | Decomposição das páginas | Quando as páginas forem componentizadas |
| P09 | Contrato de API (tabela na spec × OpenAPI) | Surgir consumidor externo | Sob demanda |
| P11 | Aprovação de cadastro MARCA (modelo: status no usuário ou na marca) | Spec de mudança "marca-com-aprovacao" | Spec de mudança |
