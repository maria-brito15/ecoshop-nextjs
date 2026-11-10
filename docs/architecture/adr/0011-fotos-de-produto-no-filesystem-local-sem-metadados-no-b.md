# ADR-0011: Fotos de produto no filesystem local, sem metadados no banco

- Status: Aceito
- Data: 2026-11-10 (ratificado; a decisão original é histórica e sem data certa)
- Decisores: Arthur (autorização geral, 2026-11-10)
- Origem: inferida do código, depois ratificada
- Capacidades: MIDIA

## Contexto
Evidência: `services/foto.service.ts` grava em `public/data_fotos/{produtoId}_*`; `Produto.fotoUrl` independente e único exibido pela UI; volume `fotos_data` no Compose. A spec viva de MIDIA chegou a descrever "foto guardada no banco como bytes" (BR-MIDIA-01) — isso nunca existiu no código; era a spec errada, não o código. Corrigido em 2026-11-10 junto com esta ratificação.

## Problema
Onde guardar mídia e como associá-la ao produto?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Filesystem + prefixo de nome (atual) | Sem dependência | Acoplado ao disco; galeria não aparece; Next pode não servir arquivos novos em produção | — |
| B. Tabela FotoProduto + rota de servir | Associação explícita | Migration e rota | — |
| C. Storage de objetos | Escala, CDN | Custo e dependência | — |

## Decisão
Opção A (manter o filesystem local). Já suporta múltiplas fotos por produto
(o prefixo `{produtoId}_` é 1:N, não 1:1) — a galeria (REQ-MIDIA-04) só falta
na UI, o armazenamento já aguenta. Revisitar se e quando o deploy for
multi-instância (o volume local não é compartilhado entre réplicas) ou se
vier o storage de objetos.

## Justificativa
Projeto ainda não está em produção (resposta do dono, 2026-11-10); trocar de
storage antes de precisar é custo sem benefício. Sem dependência externa nova
é o ADR-0003 (monolito simples) aplicado à mídia.

## Consequências
Afeta: `services/foto.service.ts`, `docker-compose.yml` (volume `fotos_data`).
BR-MIDIA-02 ("no máximo uma foto principal") foi removida da spec: nunca foi
verdade no código, que sempre aceitou várias fotos por produto.

## Verificação
REQ-MIDIA-01/02/03 em `tests/integration/midia.test.ts`.
