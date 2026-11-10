---
name: technical-writing
description: Use para produzir documentação técnica clara e consistente em português: READMEs, ADRs, specs, guias e changelogs, com a mesma estrutura e termos do projeto.
---

# Escrita técnica (EcoShop)

- Português, frases curtas, voz ativa. Termos do glossário em `docs/product/glossario.md`.
- Primeiro o que o leitor precisa fazer ou saber; depois o porquê.
- Cada afirmação sobre o sistema aponta para evidência (`arquivo:linha`, teste ou ADR) ou é marcada como inferência/dúvida.
- Não duplique: aponte para a fonte de verdade (Constitution, spec viva, ADR).
- README enxuto: o que é, como rodar, onde está a documentação. Detalhe vai para `docs/`.
- Guias (`docs/guides/`): passos numerados, comandos copiáveis, resultado esperado.
- Marque `[FATO]`, `[INFERÊNCIA]`, `[RECOMENDAÇÃO]`, `[DÚVIDA]` em documentos de análise.
