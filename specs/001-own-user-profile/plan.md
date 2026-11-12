# Plan: 001-own-user-profile

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0017 · **New ADRs / ones it supersedes:** none

## Technical approach
Downgrade `/api/usuarios` from `admin` to `autenticado` in `config/protected-routes.ts`. Security does not decrease: the handlers already require ADMIN to list, create and delete, and "own or ADMIN" to read and change (covered by REQ-AUTZ-04 and REQ-AUTZ-05). Fix the field read on the profile screen (`data.erro`).

Discarded alternative: keep `admin` in the middleware and create `/api/me` for the user's own profile. It would need a new route, a page change and would duplicate the rule; ADR-0017 already defines the handler as the place of the decision.

## Constitution Check
| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | yes | `REQ-PERF-01` stops being `todo`; `REQ-AUTZ-04/05` already cover the handler |
| III Authorization | yes | yes | decision in the handler (ADR-0017) |
| IV Sensitive data | yes | yes | responses without `senha` (REQ-AUTH-07) |
| V Layers | no | — | no structural change |
| VII Errors | yes | yes | the screen shows the API's `erro` |
| XI No invented data | no | — | |

## Affected files
| File | Change | REQ |
|---|---|---|
| `config/protected-routes.ts` | `/api/usuarios` → `autenticado` | REQ-PERF-01, REQ-AUTZ-06 |
| `app/(perfil)/perfil/page.tsx` | `data.mensagem` → `data.erro` | REQ-PERF-04 |
| `tests/integration/profile-and-middleware.test.ts` | removes the `todo` of REQ-PERF-01 | REQ-PERF-01 |
| `docs/capabilities/account-and-profile/status.md` | status | REQ-PERF-01, REQ-PERF-04 |

## Verification plan
Integration: REQ-PERF-01, REQ-AUTZ-04, REQ-AUTZ-05, REQ-AUTZ-06. Manual: open `/perfil` as CLIENTE, force an error (e.g. an invalid phone) and see the API's message.

## Risks and rollback
Risk: a handler of `/api/usuarios/*` without a check would become open to any logged-in user. Mitigation: the 3 methods of `[id]` and the 2 of `route.ts` were checked and have tests (AUTZ-04/05). Rollback: restore `nivel: "admin"` (1 line).

## Complexity Tracking
No violations.
