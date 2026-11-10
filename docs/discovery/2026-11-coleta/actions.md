# GitHub Actions (coletado em 2026-11-10)

`gh` está autenticado. Repositório: `maria-brito15/ecoshop-nextjs`.

## `gh run list --limit 30`
Existem apenas **5 execuções**, todas do workflow "CI/CD" (`.github/workflows/ci.yml`), em `main`, evento `push`, todas **failure**:

| Run | Data (UTC) | Commit (título) | Duração |
|---|---|---|---|
| 26063997705 | 2026-05-18 | chore: remove unused route matcher for IA scan in README | 30s |
| 26063829890 | 2026-05-18 | docs: update README with project details... | 37s |
| 25929059892 | 2026-05-15 | update README.md | 34s |
| 25928876719 | 2026-05-15 | feat: enhance About page with Docker and CI/CD details | 29s |
| 25891666927 | 2026-05-14 | ci: add Docker, CI/CD pipeline and update docs | 28s |

## Jobs (iguais nas 5 execuções)
- `Lint & Build`: failure
- `Docker Build & Push`: skipped
- `Deploy to Production`: skipped

## Logs
**Não deu para fazer:** `gh run view <id> --log-failed` devolve `HTTP 410` nas 5 execuções (logs expirados). O JSON dos jobs também não indica qual passo falhou. A causa da falha **não consta**.

## Versão do Node
Não vem de logs. No commit `e270c34`, o `ci.yml` usava `node-version: 20` e os passos `npm ci --frozen-lockfile`, `npx prisma generate`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. O `ci.yml` atual está modificado no working tree e não foi relido nesta coleta.

Nenhum segredo foi copiado.
