# ADR-0003: Monólito Next.js (App Router) com front-end e API no mesmo deploy

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: todas

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `app/` (páginas por Route Group) e `app/api/**` (17 Route Handlers) no mesmo projeto; `output: 'standalone'` em `next.config.ts`; um único Dockerfile para a aplicação.

## Problema
Como organizar front-end e back-end de um projeto de uma pessoa?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Monólito Next.js (atual) | Um deploy, um repositório, tipos compartilhados | Acopla ciclo de vida de UI e API | API reutilizável por outros clientes |
| B. SPA + API separada | Escala e versiona separadamente | Dois deploys e contratos para manter | Simplicidade |
| C. Server Components acessando serviços direto | Menos HTTP interno | Reescrita da UI | — |

## Decisão
Manter A (decisão histórica). Não há evidência de que foi comparada com B ou C.

## Justificativa
Inferida: adequada ao tamanho do projeto (6 entidades, uma pessoa).

## Consequências
Não há consumidor externo da API hoje; se surgir, reavaliar. Afeta: estrutura geral.

## Verificação
Revisão quando houver segundo cliente da API.
