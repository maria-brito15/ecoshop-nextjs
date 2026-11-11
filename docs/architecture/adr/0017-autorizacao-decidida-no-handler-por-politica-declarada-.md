# ADR-0017: Autorização decidida no handler por política declarada; middleware só filtra páginas e rotas só-admin

- Status: Aceito
- Data: 2026-11-10
- Decisores: Arthur (autorização geral) e Claude
- Origem: nova
- Capacidades: AUTZ, PERF
- Substitui: ADR-0008

## Contexto
D1: o middleware exigia ADMIN em todo `/api/usuarios/*`, mas `GET/PUT /api/usuarios/[id]` foi escrito para permitir o próprio usuário; a página de perfil o usa. O middleware (Edge) não conhece o dono do recurso. Aprovação: autorização geral de Arthur em 2026-11-10 para executar o roadmap; **revisar** se quiser outra opção.

## Problema
Onde mora a decisão de acesso por recurso?

## Alternativas
| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. No handler (escolhida) | Uma fonte de verdade por rota; suporta 'próprio recurso' | Cada handler precisa declarar o guard; o teste da matriz cobre | — |
| B. Só no middleware | Centralizado | Não sabe o dono do recurso no Edge | Regras por recurso |
| C. Duas camadas geradas da mesma tabela | Defesa em profundidade | Complexidade | — |

## Decisão
Opção A. O middleware passa a exigir apenas **autenticação** em `/api/usuarios` (401 sem login); o nível de acesso (admin ou próprio) é decidido pelo handler. A página `/painel` continua restrita a ADMIN no middleware (não há 'próprio recurso' ali).

## Justificativa
BR-06 ('usuário vê/edita só o próprio perfil, exceto ADMIN') exige conhecer o recurso.

## Consequências
Rotas novas devem declarar acesso no handler; matriz coberta por teste. Afeta: `config/protected-routes.ts`, `api/usuarios/**`.

## Verificação
Testes REQ-AUTZ-*/REQ-PERF-* em `tests/integration`.
