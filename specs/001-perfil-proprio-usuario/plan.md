# Plano: 001-perfil-proprio-usuario

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0017 · **ADRs novos/que substitui:** nenhum

## Abordagem técnica
Rebaixar `/api/usuarios` de `admin` para `autenticado` em `config/rotas-protegidas.ts`. A segurança não diminui: os handlers já exigem ADMIN para listar, criar e excluir, e "próprio ou ADMIN" para ler e alterar (cobertos por REQ-AUTZ-04 e REQ-AUTZ-05). Corrigir o campo lido na tela de perfil (`data.erro`).

Alternativa descartada: manter `admin` no middleware e criar `/api/me` para o próprio perfil. Exigiria rota nova, mudança na página e duplicaria a regra; o ADR-0017 já define o handler como lugar da decisão.

## Constitution Check
| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | sim | `REQ-PERF-01` deixa de ser `todo`; `REQ-AUTZ-04/05` já cobrem o handler |
| III Autorização | sim | sim | decisão no handler (ADR-0017) |
| IV Dado sensível | sim | sim | respostas sem `senha` (REQ-AUTH-07) |
| V Camadas | não | — | sem mudança estrutural |
| VII Erros | sim | sim | a tela mostra `erro` da API |
| XI Sem dado inventado | não | — | |

## Arquivos afetados
| Arquivo | Mudança | REQ |
|---|---|---|
| `config/rotas-protegidas.ts` | `/api/usuarios` → `autenticado` | REQ-PERF-01, REQ-AUTZ-06 |
| `app/(perfil)/perfil/page.tsx` | `data.mensagem` → `data.erro` | REQ-PERF-04 |
| `tests/integration/perfil-e-middleware.test.ts` | remove o `todo` de REQ-PERF-01 | REQ-PERF-01 |
| `docs/capabilities/conta-e-perfil/status.md` | status | REQ-PERF-01, REQ-PERF-04 |

## Plano de verificação
Integração: REQ-PERF-01, REQ-AUTZ-04, REQ-AUTZ-05, REQ-AUTZ-06. Manual: abrir `/perfil` como CLIENTE, forçar um erro (ex.: telefone inválido) e ver a mensagem da API.

## Riscos e reversão
Risco: um handler de `/api/usuarios/*` sem checagem passaria a ficar aberto a qualquer logado. Mitigação: os 3 métodos de `[id]` e os 2 de `route.ts` foram conferidos e têm teste (AUTZ-04/05). Reversão: restaurar `nivel: "admin"` (1 linha).

## Complexity Tracking
Sem violações.
