# Resumo do histórico git (coletado em 2026-11-10)

Fonte: `git shortlog -sn HEAD`, `git rev-list --count HEAD` e `git log`. Total: **46 commits** (`git-log.txt` tem todos).

## Autoria
| Commits | Autor |
|---|---|
| 43 | maria-brito15 |
| 3 | Duda Brito (todos em 2026-04-25) |

## Datas
- Primeiro commit: `68f56e7` — 2026-04-25 — "first commit"
- Último commit: `71a0e7a` — 2026-05-18 — "chore: remove unused route matcher for IA scan in README"
- Nenhum commit depois de 2026-05-18. O working tree tem muitas alterações não commitadas (SDD, docs, `.claude/`).

## Commits que explicam decisões (só o que o histórico mostra)
| Tema | Commit | O que o histórico mostra | O que não consta |
|---|---|---|---|
| Redis | `bf6f35c` (2026-05-11) | Cache em duas camadas: Redis no servidor + cache em memória no cliente (`lib/cache.ts`, `lib/redis.ts`, hooks). | Motivo da escolha; a mensagem só diz o "o quê". |
| Redis nas rotas | `d7280e8` (2026-05-11) | Cache em todos os handlers, com invalidação por escopo. | Problema ou métrica que motivou. |
| Redis modularizado | `d6d35e9` (2026-05-18) | Módulo de cache com provider Redis e TTLs (`lib/cache/`). | — |
| Fotos | `9e3b6f2` (2026-04-26), `56ca911` (2026-05-01), `5bcb914` (2026-05-01), `63aefa6` (2026-05-18) | Rota de fotos do produto, hook `useFotos`, serviço de fotos. | **"Fotos no banco" não consta como decisão.** O schema do primeiro commit só tem `foto_url TEXT` em `produtos`, e o `schema.prisma` atual também só mostra `fotoUrl`. Onde as fotos são guardadas ❔ conferir no código da rota/serviço. |
| JWT/cookies | `dad0ff9` (2026-05-18) | Serviço JWT com sessão e cookies (`lib/auth/`). `jose` está no `package.json` desde `68f56e7`. `56ca911` adiciona `/api/auth/refresh` e `/api/auth/me`. | Motivo de cookies; política de expiração. |
| Middleware | `aab3fb5` (2026-05-18) | Middleware com controle de acesso e tratamento de erro. `73362a9` cria `config/rotas-protegidas.ts`; `6ea44e1` adiciona `requireAuth`/`requireAdmin` nas rotas de API. `4783c33` (2026-04-26) já exigia ADMIN nas rotas de produto. | Ameaça ou risco que motivou. |
| Docker | `e270c34` (2026-05-14) | Dockerfile, compose, CI/CD e `.dockerignore`. | — |
| Docker v2 | `582f806` (2026-05-18) | Multi-stage build, health checks, `docker-entrypoint.sh`. | — |
| IA | `f0dfacd` (2026-05-18) | Análise de imagem com Azure Custom Vision + Gemini, com fallbacks, parsers e prompts. O antigo `lib/ai.ts` é removido em `88821e2`. | Por que Azure + Gemini; escolha das tags. |
| Banco | `68f56e7` | Prisma + migração `init` já no primeiro commit. | — |

Observação (inferência a partir do `--stat`, não consta como decisão): vários commits de 2026-05-18 aparentam reorganizar código já escrito (ex.: `lib/ai.ts` → `lib/ai/`, `lib/auth.ts` → `lib/auth/`).
