# SCAN · EcoScan (identificação de material por foto)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0012

## Objetivo

A partir de uma foto, identificar o material (Azure Custom Vision) e explicar sua sustentabilidade (Gemini), com contingência quando a explicação falha.

## Atores

Usuário autenticado (qualquer papel).

## Regras de negócio

- **BR-SCAN-01** — Limiar de confiança mínimo 0,7 (configurável por AI_CONFIDENCE_THRESHOLD).
- **BR-SCAN-02** — A tag "outros" nunca é uma identificação.
- **BR-SCAN-03** — A confiança é devolvida em porcentagem inteira.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-SCAN-01 | Quando uma imagem válida é enviada e o material é identificado com confiança igual ou acima do limiar, o sistema deve devolver o material, a confiança e a análise de sustentabilidade com 6 campos. | Resposta 200 com sucesso, material, confianca e os 6 campos da análise |
| REQ-SCAN-02 | Se a confiança fica abaixo do limiar, o sistema deve responder 422 sem consultar o Gemini. | Azure com 0,4 → 422 e nenhuma chamada ao Gemini |
| REQ-SCAN-03 | Se a melhor tag é "outros", o sistema deve tratar a imagem como não identificada, mesmo com confiança alta. | Azure devolve outros 0,95 → 422 |
| REQ-SCAN-04 | Se o Gemini devolve conteúdo inválido, o sistema deve responder 200 com a análise de contingência. | Gemini devolve texto sem JSON → 200 com análise padrão |
| REQ-SCAN-05 | Se a chamada ao Gemini falha por rede, o sistema deve responder 200 com a análise de contingência. | fetch lança erro → 200 com análise padrão |
| REQ-SCAN-06 | Se o arquivo falta, não é imagem aceita ou excede 10 MB, o sistema deve responder 400. | Sem arquivo, .gif ou 11 MB → 400 |
| REQ-SCAN-07 | Se o Azure não responde ou falha, o sistema deve responder 422 com sugestão ao usuário, não 500. | fetch do Azure falha → 422 |
| REQ-SCAN-08 | Quando a análise indica descarte correto e impacto, o sistema deve exibi-los na tela do EcoScan. | Tela mostra os 6 campos devolvidos |
| REQ-SCAN-09 | O sistema deve aplicar tempo limite às chamadas ao Azure e ao Gemini e tratar o estouro como falha da dependência (REQ-SCAN-05 e REQ-SCAN-07). | Chamada que não responde é abortada; Azure → `null` (422 na rota), Gemini → `null` (contingência) |

## Casos-limite

Tags reconhecidas pelo modelo do Azure ainda são poucas e não estão documentadas (resposta do dono, 2026-11-10). Sem rate limit no scan (ver pergunta aberta).

## Interfaces

POST /api/ia/scan (multipart, campo file) · Azure Custom Vision (prediction) · Gemini 2.0 Flash · página /ia-scan.

## NFRs aplicáveis

NFR-SEG-05, NFR-DES-02.

## Fora de escopo

Salvar histórico de scans; identificar mais de um material por foto.

## Perguntas abertas

1. Quais tags o modelo Azure reconhece hoje? (documentar em interfaces-externas)
2. O scan precisa de limite de requisições por usuário, como o chat?
