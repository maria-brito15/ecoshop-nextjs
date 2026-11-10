# ADR-0014: Domínio, código e mensagens em português; termos de framework em inglês

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: todas

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: entidades (`Produto`, `Marca`), funções (`listarProdutos`), mensagens e rotas (`/produtos`, `/api/categorias`) em português.

## Problema
Qual idioma para o domínio?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Português (atual) | Linguagem ubíqua com o domínio | Mistura com termos de framework | — |
| B. Inglês no código | Convenção comum | Reescrever | — |

## Decisão
Ratificar A (vira Art. XIV.1 da Constitution).

## Justificativa
Já é consistente no código.

## Consequências
Glossário em docs/product/glossario.md.

## Verificação
Revisão.
