# Plano: 011-redis-cache-e-rate-limit

- **Status:** Implementado em 2026-11-11. ADR-0020 (Aceito) substitui o ADR-0010.
- **Decisões:** ver o ADR-0020 (alternativas e consequências). Detalhes de implementação: `comPrazo` + fila offline limitada no cliente; `SET NX EX` + `INCR` numa transação; `ContadorDeJanela` como interface de duas implementações (Redis e memória), com injeção só em `rateLimit` para teste; single-flight com um `Map` de promessas em andamento; saúde composta por função pura (`comporRelatorio`).
- **Verificação:** `tests/integration/redis-e-cache.test.ts` (16 testes, sem banco; um deles inicia um processo filho com Redis inexistente).
