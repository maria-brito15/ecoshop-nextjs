---
name: software-architecture
description: Use para avaliar desenhos, trade-offs e decisões técnicas (estrutura, dependência, modelo de dados, padrão) e registrar a decisão como ADR com alternativas e consequências.
---

# Arquitetura e ADRs (EcoShop)

## Quando criar ADR
Mudança em caminho sensível de `sdd.config.json`, dependência de runtime nova, mudança de schema Prisma, ou decisão que o próximo desenvolvedor não deduz do código. Decisões pendentes: `docs/architecture/adr/pendentes.md`.

## Passos
1. Leia os ADRs vigentes da área e a Constitution; não contradiga sem emendar/substituir.
2. Liste 2–3 alternativas reais, com custo e risco; recomende uma e diga o porquê.
3. Escreva `docs/architecture/adr/NNNN-titulo.md` a partir de `0000-template.md` (Contexto, Decisão, Alternativas, Consequências positivas e negativas, Status, Substitui).
4. Status inicial "Proposto". Só o dono muda para "Aceito" (gate G2). ADR aceito não se edita: crie outro com `Substitui: ADR-NNNN`.
5. Rode `node scripts/sdd/adr-index.mjs` para atualizar o índice.

## Distinga
Decisão tomada (fato) · decisão inferida do código (inferência, marque como tal) · recomendação (proposta).
