---
name: test-strategy
description: Use ao escrever ou revisar testes do EcoShop: ligar teste a REQ, escolher nível, tratar defeitos conhecidos como caracterização e manter a suíte determinística.
---

# Estratégia de testes (ADR-0016)

- Local: `tests/integration/*.test.ts`, `node:test` via `tsx`, contra Postgres e Redis reais; Azure e Gemini com `stubFetch`.
- Título: `test("REQ-XXX-NN: comportamento observável", …)`. `trace-check` liga REQ ↔ teste ↔ `status.md`.
- Primeiro import: `./helpers` (define o ambiente). Chame `encerrar` em `after`.
- Dados únicos por execução: `email("nome")`; IP novo por requisição (`ipNovo`) para não colidir no rate limit; `limparRateLimit()` quando o teste conta tentativas.
- Defeito conhecido: `test("REQ-…", { todo: "motivo" }, …)` descreve o comportamento CORRETO e fica pendente; remova o `todo` no commit que corrige.
- Verificação manual: `skip` + evidência `manual: AAAA-MM-DD …` em `status.md`.
- Ordem: caso feliz, cada regra de negócio, erros (400/401/403/404/409/429/5xx), limites.
- Não teste implementação; teste status, corpo e efeito no banco.
