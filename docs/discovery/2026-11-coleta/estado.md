# Estado das verificações (2026-11-10)

Ambiente: Windows 11, Node **v24.15.0** (o `.nvmrc` pede 22), Postgres 17 + Memurai locais.

Antes de rodar, o `node_modules` estava incompleto (sem `eslint`); rodei `npm ci` e `npx prisma generate` (não alteram arquivos rastreados; `package-lock.json` já aparecia modificado antes).

| Verificação | Resultado | Esperado | Difere? |
|---|---|---|---|
| `npm run lint` | 0 erros, 32 avisos | 0 erros / 32 avisos | não |
| `npx tsc --noEmit` | exit 0, sem saída | (não informado) | — |
| `npm test` (banco `ecoshop_test`, Redis db 1) | 47 testes: 40 ok, 0 falha, 6 todo, 1 skip | 47 (40 ok, 6 todo, 1 skip) | não |
| `npm run sdd:check` | **falha** (exit 1) | verde | **sim** |

## `sdd:check` no Windows
Saída: `spec-lint: 28 problema(s)` — todos "cita ADR-00NN, que não existe" (mais um de nome de pasta em `specs/`). Os ADRs existem em `docs/architecture/adr/`.

Causa provável (confirmada em parte): `scripts/sdd/lib.mjs:64` usa `/\/\d{4}-.*\.md$/` e `:71` usa `[^/]*`; no Windows os caminhos usam `\`, então nenhum ADR é lido. Numa **cópia fora do repositório** com essas duas regex aceitando `\`, o `spec-lint` caiu de 28 para 1 problema (nome da pasta `specs/001-...` também tratado como caminho absoluto com `\`), o `trace-check` passou (77 requisitos, 40 ✅, 40 com teste) e o `adr-index --check` ainda acusou "README.md desatualizado" (não investiguei; pode ser o mesmo problema de caminho ou um índice realmente desatualizado ❔). Não rodei `sdd:check` em Linux/CI, então "verde" aqui continua não confirmado. Nada foi alterado no repositório.

## Outros achados
- `npm run seed:admin` → "Missing script" no npm mesmo com o script presente em `package.json:19`.
- Testes rodaram só com o banco de teste; criam usuários `@test.local` (ficaram no `ecoshop_test`).
