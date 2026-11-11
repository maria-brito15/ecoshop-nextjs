# AUTH · Status de implementação

Legenda: ✅ implementado e testado · ◐ parcial ou sem teste · ❌ não implementado ou defeituoso · ❔ incerto, precisa verificação. Evidência: `test: <arquivo>` ou `manual: AAAA-MM-DD <o quê>` ou `código: <onde>`.

## Status

| REQ | Status | Evidência | Verificado em |
|---|---|---|---|
| REQ-AUTH-01 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-02 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-03 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-04 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-05 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-06 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-07 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-08 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-09 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-10 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-11 | ✅ | test: tests/integration/autenticacao.test.ts (ADR-0018: cadastro como MARCA fica CLIENTE + Marca PENDENTE) | 2026-11-10 |
| REQ-AUTH-12 | ◐ | código: lib/schemas/usuario.ts (min 8); sem teste automatizado | 2026-11-10 |
| REQ-AUTH-13 | ❔ | ADR pendente P02: hoje o token vale até 7 dias | 2026-11-10 |
| REQ-AUTH-14 | ✅ | test: tests/integration/autenticacao.test.ts | 2026-11-10 |
| REQ-AUTH-15 | ◐ | test: tests/integration/entrada-e-erros.test.ts (schemas dos 3 fluxos, executados sem banco); os testes de cadastro duplicado em outra caixa e de login de conta antiga **não foram executados** (precisam de banco) | 2026-11-11 |
| REQ-AUTH-16 | ✅ | test: tests/integration/entrada-e-erros.test.ts (cadastro público, cadastro admin e atualização; conta bytes) | 2026-11-11 |
| REQ-AUTH-17 | ◐ | test: tests/integration/entrada-e-erros.test.ts (`caminhoLocalOuRaiz`, 14 entradas); a tela `app/(auth)/sign-in/page.tsx` usa a função (verificado por `tsc`), **sem teste de interface** | 2026-11-11 |
| REQ-AUTH-18 | ✅ | test: tests/integration/sessao.test.ts | 2026-11-11 |
| REQ-AUTH-19 | ◐ | test: tests/integration/sessao.test.ts (serviço com armazém em memória, uso único, concorrência, papel relido, Redis fora; armazém REAL no Redis: só hash, validade, GETDEL, revogação). O ciclo completo por HTTP (login → cookies → refresh) **não foi executado** (precisa de banco). Duração de 15 min é valor inicial sem medição | 2026-11-11 |
| REQ-AUTH-20 | ◐ | test: tests/integration/sessao.test.ts (logout, revogar todas, nunca lança). A revogação ao trocar senha e excluir usuário está no código (`usuario.service`) **sem teste de ponta a ponta** (precisa de banco) | 2026-11-11 |
| REQ-AUTH-21 | ◐ | test: tests/integration/sessao.test.ts (mapeamento 403 e schema executados); o teste por rota (403 sem a senha atual, 200 com ela, ADMIN isento) **não foi executado** (precisa de banco). A tela de perfil atual não tem campo de senha, então a regra não quebra a interface | 2026-11-11 |
| REQ-AUTH-22 | ✅ | test: tests/integration/sessao.test.ts (middleware real, com e sem cookie de renovação) | 2026-11-11 |
| REQ-AUTH-23 | ◐ | test: tests/integration/sessao.test.ts (**não executado**: precisa de banco; mede tempo, pode ser sensível a ruído) | 2026-11-11 |
