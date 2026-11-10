---
name: requirements-engineering
description: Use para levantar, analisar e estruturar requisitos antes de projetar ou codar: transformar um pedido em requisitos testáveis com ID, critério de aceite e perguntas abertas.
---

# Engenharia de requisitos (EcoShop)

## Onde escrever
- Comportamento atual/alvo: `docs/capabilities/<cap>/spec.md` (requisitos vivos) e `status.md`.
- Mudança nova: `specs/NNN-*/spec.md` (delta), citando os REQ afetados.

## Formato
- ID `REQ-<CAP>-NN` (CAP em `sdd.config.json`), regra de negócio `BR-<CAP>-NN`, não funcional `NFR-…`. IDs nunca são reutilizados.
- Enunciado em EARS: "Quando <evento>, o sistema deve <resposta>"; "Se <condição>, o sistema deve …"; "O sistema nunca deve …".
- Critério de aceite decidível: entrada → saída/status observável. Se não dá para virar teste, diga como verificar à mão.
- Status ✅ ◐ ❌ ❔ com evidência (`test:`, `manual: AAAA-MM-DD …`, `código:`).

## Como trabalhar
1. Separe fato (visto no código/teste), inferência, recomendação e dúvida.
2. Anote perguntas abertas na spec em vez de decidir sozinho.
3. Cada requisito responde: quem, quando, o quê, como saber que está certo.
4. Rode `node scripts/sdd/spec-lint.mjs` ao terminar.

## Evite
Requisitos vagos ("rápido", "seguro"), vários comportamentos num só ID, solução disfarçada de requisito.
