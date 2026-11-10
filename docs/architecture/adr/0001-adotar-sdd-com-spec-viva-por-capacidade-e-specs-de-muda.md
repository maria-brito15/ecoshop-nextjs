# ADR-0001: Adotar SDD com spec viva por capacidade e specs de mudança do Spec Kit

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: nova
- Capacidades: todas

## Contexto
O EcoShop é um sistema existente (brownfield). O diagnóstico (docs/discovery/2026-11-baseline) mostra intenção espalhada no README e nos comentários, divergindo do código (ex.: D1), sem testes e sem registro de decisões. O Spec Kit gera uma spec por feature, que envelhece depois do merge.

## Problema
Como ter uma fonte de verdade do comportamento que não envelheça, mantendo o fluxo de comandos do Spec Kit?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Só Spec Kit (spec por feature) | Fluxo pronto | Specs antigas envelhecem; ninguém sabe o comportamento atual sem ler todas | Visão do presente |
| B. Spec Kit + spec viva por capacidade (escolhida) | Presente sempre legível; histórico imutável | Passo de consolidação em todo PR | Nada relevante |
| C. Adicionar OpenSpec | Spec viva nativa por deltas | Segunda ferramenta e segundo conjunto de artefatos-fonte | Simplicidade |

## Decisão
Opção B. `specs/NNN-*` (Spec Kit) registra uma mudança e fica imutável após o merge; `docs/capabilities/<cap>/` é a spec viva, atualizada na consolidação (gate G4). Três trilhas proporcionais ao tamanho da mudança (doc 03 do pacote de planejamento, preservado em docs/discovery).

## Justificativa
Dá a ideia de 'lei consolidada + emendas' sem segunda ferramenta, e mantém um único artefato-fonte por tipo de conhecimento.

## Consequências
Positivas: o presente fica legível; drift detectável por script. Negativas: custo de consolidação em cada PR; exige disciplina nas trilhas. Afeta: toda mudança de comportamento.

## Verificação
`npm run sdd:check` no CI; template de PR exige capacidades e REQs.
