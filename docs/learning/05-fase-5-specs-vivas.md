# Fase 5 · Specs vivas

**O que foi feito:** 12 capacidades, 77 requisitos em EARS (`Quando…, o sistema deve…`), cada um com critério de aceite, status e evidência.

**Retrato honesto (2026-11-10):** 40 ✅, o restante ◐/❌/❔. Os ❌ e ❔ são o backlog real: aprovação de MARCA, UI do chat, métricas com fonte real, seed utilizável, validação de paginação, 409 em duplicidade, invalidação de cache ao renomear marca, falha de rede do Gemini virando 500.

**Lição:** escrever a spec *depois* do código (retroativa) obriga a separar o que o código faz do que se queria. As "Perguntas abertas" de cada spec são perguntas ao dono, não buracos a preencher por suposição.

**Ferramentas:** `spec-lint` (formato), `trace-check` (REQ ↔ teste ↔ status), `adr-index` (índice e cadeia de substituição), `impact-map` (arquivo → capacidade/ADR).
