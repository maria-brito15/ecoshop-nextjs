# Verificação manual (2026-11-10)

## Como foi feito
- **Docker não foi usado:** o daemon do Docker Desktop não estava ativo (erro de pipe `dockerDesktopLinuxEngine`).
- Postgres 17 e Redis (Memurai) locais. Criei um banco separado `ecoshop_test` (migration `init` aplicada) e usei Redis no db 1. O banco de desenvolvimento `ecoshop-refactor` não foi alterado (2 ADMIN, 2 CLIENTE, 3 MARCA antes e depois).
- `npm run dev` com `DATABASE_URL`/`REDIS_URL` apontando para o banco de teste.
- ADMIN criado com o `seed-admin` (id 38, credenciais de `.env.local`, não exibidas). **`npm run seed:admin` falhou** com "Missing script" embora o script exista no `package.json` (linha 19); rodei `npx tsx prisma/seed-admin.ts`, que é o que o script executa. A causa da falha do npm não foi investigada.
- CLIENTE criado por `POST /api/users` (equivalente ao cadastro).
- **Não houve navegador:** só HTTP (`fetch`/`curl`). Tudo que depende de ver a tela (dados renderizados, mensagem exibida, aba Histórico) **não deu para testar**.

## Resultados
| REQ | Resultado | O que vi | Evidência |
|---|---|---|---|
| REQ-PERF-01 | não deu para testar (tela); API ok | Com cookie de CLIENTE: `GET /api/auth/me` 200 e `GET /api/usuarios/{id}` 200 com `id,nome,email,telefone,tipo,criadoEm` (sem senha). Renderização em `/perfil` não vista. | manual: 2026-11-10 GET /api/usuarios/{id} como CLIENTE → 200 sem senha (API apenas; tela não verificada) |
| REQ-PERF-04 | não deu para testar (tela); API ok | `PUT /api/usuarios/{id}` com nome de 1 caractere → 400 com `{"erro":"Dados inválidos","detalhes":{...fieldErrors.nome:["Nome deve ter pelo menos 3 caracteres"]}}`. Se a tela mostra só `erro`, o usuário vê "Dados inválidos" e não a mensagem do campo — ❔ não confirmado na tela. | manual: 2026-11-10 PUT nome="A" → 400 {erro:"Dados inválidos", detalhes.fieldErrors.nome} (tela não verificada) |
| REQ-PERF-05 | falhou (por leitura de código; tela não testada) | `grep` por `ecoshop_history` em `app/` e `lib/`: só uma ocorrência, **leitura** em `app/(perfil)/perfil/page.tsx:467`. Nenhum código grava o histórico, então visitar produtos não alimenta a aba. | manual: 2026-11-10 grep ecoshop_history → só getItem em perfil/page.tsx:467, nenhum setItem (tela não verificada) |
| REQ-AUTZ-08 | falhou | Visitante: `GET /ia-scan` → **200**, sem redirecionamento. Para comparação, `/perfil` e `/painel` → 307 para `/sign-in?next=...`. `POST /api/ia/scan` sem sessão → 401. | manual: 2026-11-10 visitante GET /ia-scan → 200 (sem Location); /perfil → 307 /sign-in?next=%2Fperfil |

## Observações
- Os resultados de REQ-AUTZ-08 e REQ-PERF-05 batem com `status.md` (❔ nos dois, com a página pública e o histórico nunca gravado).
- Se o `/ia-scan` deve ser protegido é pergunta aberta 1 da spec de autorização (dono decide); aqui só se registra o comportamento observado.
