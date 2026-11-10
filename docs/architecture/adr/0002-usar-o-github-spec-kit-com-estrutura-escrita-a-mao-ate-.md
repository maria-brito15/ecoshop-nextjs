# ADR-0002: Usar o GitHub Spec Kit com estrutura escrita à mão até fixar uma versão

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: nova
- Capacidades: processo

## Contexto
O Spec Kit muda rápido (extensões, presets, comandos ora `/speckit.plan`, ora skills `speckit-plan`). O ambiente que criou esta estrutura não alcançava o repositório do Spec Kit, então `specify init` não pôde ser executado.

## Problema
Como começar a usar o fluxo sem fixar premissas erradas sobre a ferramenta?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Escrever `.specify/` à mão seguindo a convenção documentada (escolhida) | Funciona já; fácil de reconciliar | Pode divergir da versão real | — |
| B. Esperar para rodar `specify init` | Estrutura oficial | Bloqueia o resto | Fases 1–7 |
| C. Não usar Spec Kit | Menos dependência | Perde roteiro e templates | Objetivo de aprendizado |

## Decisão
Opção A. Estrutura em `.specify/` documentada em `.specify/README.md`. **Pendência aberta:** rodar `specify init --here --integration claude` numa cópia, com versão fixada, comparar e registrar a versão neste ADR (que então ganha uma seção 'Versão fixada').

## Justificativa
Decisão reversível e de baixo custo; o valor está nos artefatos (Constitution, templates), não no gerador.

## Consequências
Negativas: os comandos `/speckit.*` podem esperar arquivos diferentes dos escritos aqui. Mitigação: reconciliação documentada. Afeta: `.specify/**`.

## Verificação
Revisão obrigatória na primeira vez em que `/speckit.*` for executado.
