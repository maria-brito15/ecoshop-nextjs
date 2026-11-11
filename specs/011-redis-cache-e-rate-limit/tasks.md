# Tarefas: 011-redis-cache-e-rate-limit

- **Status:** Concluídas em 2026-11-11, sem commits.

| # | Tarefa | REQ | Feito quando |
|---|---|---|---|
| T1 | `comPrazo`, fila limitada, avisos limitados a 1 a cada 30 s | REQ-OPS-14 | processo filho sem Redis: operações em ms |
| T2 | Rate limit atômico, reserva em memória, IP por `TRUST_PROXY_HOPS` | REQ-OPS-15, 16 | testes passam |
| T3 | Chave de cache dos filtros validados; `nome` ≤ 100; service recebe filtros tipados | REQ-CAT-10 | testes passam |
| T4 | Single-flight em `comCache` | REQ-OPS-17 | 8 chamadas → 1 busca |
| T5 | Saúde `ok`/`degradado`/`indisponivel` | REQ-OPS-01 | regra testada; teste com banco **não reexecutado** |
| T6 | ADR-0020, specs vivas, `.env.example`, compose | todos | `sdd:check` verde |
