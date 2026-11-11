# ADR-0012: IA em duas etapas: Azure Custom Vision classifica e Gemini explica, com fallback estático

- Status: Inferido
- Data: desconhecida (sem histórico git no pacote analisado)
- Decisores: desconhecido (decisão histórica)
- Origem: inferida do código
- Capacidades: SCAN, CHAT

> **Decisão inferida:** o código mostra este estado; não há prova de que foi uma escolha formal. As alternativas foram reconstruídas. Pode ser ratificada (novo ADR Aceito) ou substituída.

## Contexto
Evidência: `lib/ai/analyze-image.ts`; `providers/azure-vision.ts`, `providers/gemini-chat.ts`; limiar `AI_CONFIDENCE_THRESHOLD` (0,7) e tag `outros`; fallback `analiseBasica`. O modelo Azure e suas tags são artefatos externos ao repositório (poucas tags hoje, segundo o dono).

## Problema
Como identificar o material de uma foto e explicar o descarte?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. Classificador + LLM (atual) | Classes controladas; custo menor por foto | Dois fornecedores; modelo precisa de treino | — |
| B. LLM multimodal único | Simplicidade | Menos controle das classes | — |
| C. Classificador + conteúdo curado | Sem custo de LLM | Conteúdo a manter | — |

## Decisão
Manter A como histórica; escopo da IA pendente (P06).

## Justificativa
Inferida.

## Consequências
Rede do Gemini sem try/catch derruba o scan (D4). Afeta: `lib/ai/**`, `api/ia/**`.

## Verificação
Testes com provedores simulados (Art. VIII).
