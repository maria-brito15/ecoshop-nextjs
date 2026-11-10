# ADR-0015: ESLint 9 (flat config) e Prettier, no lugar de `next lint`

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: nova
- Capacidades: processo

## Contexto
`npm run lint` chamava `next lint`, depreciado no Next 15, sem ESLint instalado: o comando abria um assistente interativo e falhava no CI (D10), impedindo os jobs de docker e deploy.

## Problema
Como ter lint que funcione no CI sem refatorar em massa?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. ESLint 9 + eslint-config-next + Prettier (escolhida) | Padrão da ecossistema, funciona no CI | 31 avisos preexistentes | — |
| B. Biome | Uma ferramenta | Menos regras de Next/React | — |

## Decisão
Opção A. Regras que produziam erro no código existente (`no-explicit-any`, `no-empty-object-type`, `no-html-link-for-pages`) ficam como **aviso** até serem corrigidas por specs de mudança; código novo deve estar limpo. `no-restricted-imports` de `@/lib/db` em `app/**` aplica o Art. V (aviso por ora).

## Justificativa
Destrava o CI sem uma refatoração em massa.

## Consequências
Avisos podem ser ignorados; revisar na Fase 4. Afeta: `eslint.config.mjs`, `package.json`, CI.

## Verificação
`npm run lint` no CI.
