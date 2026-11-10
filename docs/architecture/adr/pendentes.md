# Decisões arquiteturais pendentes

Ainda **não são ADRs**: faltam decisão e dados. Cada uma vira ADR (próximo número livre) quando uma spec de mudança precisar dela. Alternativas e recomendação inicial em `docs/discovery/2026-11-baseline/06-inventario-adrs.md`.

| Código | Decisão | Depende de | Quando decidir |
|---|---|---|---|
| P02 | Política de sessão (revogação, duração) — substitui o ADR-0007 se mudar | Não há produção ainda: bom momento | Antes do primeiro deploy |
| P04 | Rate limit sem Redis (fail-open/closed/memória) | — | Antes do primeiro deploy |
| P05 | Estratégia de consistência de cache | Medição de necessidade real | Spec de catálogo |
| P06 | Escopo e forma da IA (modelo Azure, chat com UI) | Tags do Azure documentadas; spec do chat | Spec do chat/UI |
| P07 | Busca de dados na UI (hooks × Server Components × biblioteca) | Decomposição das páginas | Quando as páginas forem componentizadas |
| P09 | Contrato de API (tabela na spec × OpenAPI) | Surgir consumidor externo | Sob demanda |
| P11 | Aprovação de cadastro MARCA (modelo: status no usuário ou na marca) | Spec de mudança "marca-com-aprovacao" | Spec de mudança |

Resolvidas: P03 (armazenamento de mídia) foi ratificada em 2026-11-10 como ADR-0011 Aceito — mantém filesystem local.

## Funcionalidades decididas, ainda não construídas

Não são decisões de arquitetura (por isso não entram na tabela acima); são respostas do dono (`docs/discovery/2026-11-baseline/11-respostas-e-correcoes-iniciais.md`) que ainda não têm código. Backlog explícito — nenhuma foi implementada na rodada de estabilização de 2026-11-10.

| O quê | REQ relacionado | Rastreio |
|---|---|---|
| Aprovação de cadastro MARCA por um ADMIN | REQ-AUTH-11, REQ-USR-03 | P11 (acima) |
| Chat de sustentabilidade com interface | REQ-CHAT-06 | P06 (acima) |
| Filtro de produtos por marca; ordenação/limite de preço no catálogo inteiro | REQ-CAT-06, REQ-CAT-07 | `docs/capabilities/catalogo/spec.md` |
| Galeria de fotos do produto (armazenamento já suporta várias fotos) | REQ-MIDIA-04 | `docs/capabilities/midia-de-produto/spec.md`, ADR-0011 |
| Histórico de produtos vistos e métricas de impacto a partir de dado real | REQ-PERF-05, REQ-PERF-06, REQ-CONT-02, REQ-CONT-05 | `docs/capabilities/conta-e-perfil/spec.md`, `docs/capabilities/conteudo-institucional/spec.md` |
| API para editar o vínculo produto↔certificado (hoje só o seed preenche) | REQ-PROD-05 | `docs/capabilities/gestao-de-produtos/spec.md` |
