# Tarefas: 009-erros-e-entrada

- **Status:** Implementadas em 2026-11-11, **sem commits**. Resultado por requisito nos `status.md` das capacidades. **Não executado:** os testes que precisam de banco (5 de `input-and-errors.test.ts`, mais `ecoscan.test.ts` e `chat-ai.test.ts` existentes, que usam banco nos helpers), porque não havia banco de teste disponível; 22 dos 27 testes novos foram executados e passam. O ADR-0012 (`lib/ai/**`) deve ser citado na PR.

| # | Tarefa | REQ | Feito quando |
|---|---|---|---|
| T1 | `lib/errors/dominio.ts` + `mapeiaErro`; services lançam erros tipados; handlers sem `err.message` | REQ-USR-07 | testes do mapeador passam; `grep "err.message"` em `app/api` vazio |
| T2 | `parseId`, `idDaRota` e uso em todas as rotas `[id]` | REQ-CAT-09, PROD-06, MIDIA-05, REF-05, USR-06 | `abc`, `0`, `-1`, `1.5`, `1e3` → 400 em cada rota |
| T3 | `emailSchema`, `senhaSchema`; busca sem diferença de caixa; captura de P2002 | REQ-AUTH-15, AUTH-16, USR-07 | testes de schema passam; testes com banco escritos |
| T4 | Auto-exclusão de ADMIN → 409 | REQ-USR-08 | teste escrito (precisa de banco) |
| T5 | `caminhoLocalOuRaiz` na tela de login | REQ-AUTH-17 | testes da função passam |
| T6 | Chat: limites do `historico`, `gerarComHistorico`, chave no cabeçalho | REQ-CHAT-08, CHAT-09 | testes passam |
| T7 | `fetchComTimeout` nos provedores; `gerarTexto` sem lançar | REQ-SCAN-09, SCAN-05 | testes passam; `todo` de REQ-SCAN-05 removido |
| T8 | Specs vivas, status e `sdd:check` | todos | `sdd:check`, lint e `tsc` verdes |
