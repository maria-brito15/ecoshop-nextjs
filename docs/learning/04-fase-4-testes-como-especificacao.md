# Fase 4 · Testes como especificação executável

**O que foi feito:** 47 testes de integração (`node:test` + `tsx`, contra Postgres e Redis reais; Azure/Gemini simulados). Cada teste leva o ID do requisito no título.

**Conceitos**
- *Teste de caracterização*: descreve o comportamento correto de algo ainda quebrado e fica `todo` (não derruba o CI, mas aparece). Ex.: REQ-CAT-05, REQ-REF-02. Quando o defeito é corrigido, remove-se o `todo` — foi o que aconteceu com REQ-PERF-01 no piloto.
- *Rastreabilidade*: `trace-check` falha se um REQ ✅ não tem teste ativo, ou se um teste cita REQ inexistente. É o que impede a spec de mentir.

**Achados ao escrever os testes:** `POST /api/usuarios` também devolvia o hash da senha (além do `PUT`); excluir categoria com produtos responde 404 e não 409, porque o código procura "P2025" em `err.message` e a mensagem do Prisma inclui um trecho de código com esse texto.

**Defeitos corrigidos aqui (decisão do dono):** D2 (hash de senha exposto) e D3 (chat de IA público e sem limite).
