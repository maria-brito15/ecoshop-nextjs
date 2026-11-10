# ADR-0011: Fotos de produto no filesystem local, sem metadados no banco

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: MIDIA

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `services/foto.service.ts` grava em `public/data_fotos/{produtoId}_*`; `Produto.fotoUrl` independente e único exibido pela UI; volume `fotos_data` no Compose.

## Problema
Onde guardar mídia e como associá-la ao produto?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Filesystem + prefixo de nome (atual) | Sem dependência | Acoplado ao disco; galeria não aparece; Next pode não servir arquivos novos em produção | — |
| B. Tabela FotoProduto + rota de servir | Associação explícita | Migration e rota | — |
| C. Storage de objetos | Escala, CDN | Custo e dependência | — |

## Decisão
Manter A como histórica; decisão pendente (P03).

## Justificativa
Inferida.

## Consequências
Afeta: `services/foto.service.ts`, `docker-compose.yml`.

## Verificação
—
