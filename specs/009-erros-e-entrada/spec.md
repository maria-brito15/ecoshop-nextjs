# Spec de mudança: 009-erros-e-entrada

- **Trilha:** correção (a Constitution Art. VI, VII e VIII já exigem este comportamento; o código o descumpre) com mudança de regra em REQ-AUTH-15 a 17 e REQ-USR-08
- **Capacidades afetadas:** AUTH, USR, REF, CAT, PROD, MIDIA, CHAT, SCAN
- **Status:** Implementada em 2026-11-11 (autonomia técnica concedida pelo dono); verificação parcial — ver `status.md` de cada capacidade
- **Autor / aprovador:** Claude / dono do projeto · **Data:** 2026-11-11

## Problema

A auditoria de 2026-11-11 achou, em entrada de dados e tratamento de erro:

- Services lançam `Error("P2025")`, `Error("EMAIL_JA_CADASTRADO")`, `Error("MARCA_NAO_PENDENTE")` etc., e handlers decidem a resposta por `err.message` (Art. VII.1–2).
- `PUT /api/usuarios/[id]` de usuário inexistente, e-mail repetido na atualização e exclusão de usuário que tem marca caem em **500** (o handler procura `"P2025"` na mensagem, mas o Prisma coloca o código em `err.code`) (Art. VII.4).
- `id` de rota inválido (`abc`) vira `NaN`, o Prisma lança erro de validação e a resposta é **500** (Art. VI.1).
- E-mail sem normalização: `A@x.com` e `a@x.com` são contas diferentes.
- Senha sem limite máximo: o bcrypt só usa os primeiros 72 bytes.
- `?next=` da tela de login é usado sem validar: redirecionamento aberto.
- Chat: `historico` sem limite de tamanho; chave do Gemini na URL; chamada ao Gemini duplicada no handler.
- Chamadas ao Azure e ao Gemini sem timeout; falha de rede do Gemini no scan vira 500 (Art. VIII.2; REQ-SCAN-05 já exigia 200 com contingência).

## Fora de escopo

- Exigir a senha atual para trocar a senha → spec de sessão (010), porque muda o contrato da API e a tela de perfil.
- Campo `codigo` no corpo de erro (Art. VII.3) e o desmembramento de handlers em services → spec de camadas (012).
- Migration que normaliza e-mails já gravados: a busca passa a ignorar a caixa, então contas antigas continuam entrando sem migration.
- Mudar mensagens de erro existentes.

## Comportamento atual (fato, com evidência)

- `services/usuario.service.ts:100,218`, `services/marca.service.ts:115,118,143,146,216`, `services/categoria.service.ts:147`, `services/certificado.service.ts:126`: `throw new Error("<texto>")`.
- `app/api/usuarios/[id]/route.ts:103,135`: `err.message.includes("P2025")`; `app/api/marcas/[id]/aprovar/route.ts`, `app/api/marcas/route.ts`, `app/api/users/route.ts`, `app/api/usuarios/route.ts`: comparação de `err.message` com strings.
- `lib/http/responses.ts`: `mapeiaErroPrisma` também compara `err.message === "P2025"`.
- Rotas `[id]`: `Number(id)` sem validação (produtos, usuarios, marcas, aprovar, categorias, certificados); só `fotos` checa `isNaN`.
- `lib/schemas/usuario.ts`: e-mail só `z.string().email()`; senha `min(8)`.
- `app/(auth)/sign-in/page.tsx:200`: `get("next") || "/"` sem validação.
- `lib/schemas/ia-chat.ts`: só `mensagem` tem limite. `app/api/ia/chat/route.ts` monta a URL do Gemini com `?key=` e tem sua própria `gerarTextoWithHistory`.
- `lib/ai/providers/*.ts`: `fetch` sem `signal`; `gerarTexto` sem `try/catch`.
- `tests/integration/ecoscan.test.ts:117`: o teste de REQ-SCAN-05 está como `todo: "D4: hoje a exceção vira 500"`.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-CAT-09 | Se o `id` de `GET /api/produtos/[id]` não é um inteiro positivo, o sistema deve responder 400. | `abc`, `0`, `-1`, `1.5`, `1e3` → 400 (não 500) | Novo |
| REQ-PROD-06 | Se o `id` de `PUT` ou `DELETE /api/produtos/[id]` não é um inteiro positivo, o sistema deve responder 400. | ADMIN com `id=abc` → 400 | Novo |
| REQ-MIDIA-05 | Se o `id` das rotas de fotos não é um inteiro positivo, o sistema deve responder 400. | `1.5` e `abc` → 400 | Novo |
| REQ-REF-05 | Se o `id` das rotas de categorias, marcas ou certificados não é um inteiro positivo, o sistema deve responder 400. | `abc` → 400 em GET, PUT e DELETE | Novo |
| REQ-USR-06 | Se o `id` de `/api/usuarios/[id]` ou de `POST /api/marcas/[id]/aprovar` não é um inteiro positivo, o sistema deve responder 400 (depois de checar a sessão). | ADMIN com `id=abc` → 400; sem sessão → 401/403 | Novo |
| REQ-USR-07 | Quando uma atualização ou exclusão de usuário falha por inexistência, e-mail repetido ou vínculo com marca, o sistema deve responder 404, 409 e 409, respectivamente. | `PUT` de id inexistente → 404; `PUT` com e-mail de outro → 409; `DELETE` de usuário com marca → 409 | Novo |
| REQ-USR-08 | Se um ADMIN tenta excluir a própria conta, o sistema deve responder 409 e manter a conta. | `DELETE /api/usuarios/<meu id>` → 409 | Novo (regra) |
| REQ-AUTH-15 | O sistema deve normalizar o e-mail (remover espaços das pontas e converter para minúsculas) no cadastro, no login e na atualização, e buscar usuários ignorando a diferença de caixa; ao cadastrar MARCA com nome de marca já existente, deve responder 409. | Cadastrar `Foo@X.com` grava `foo@x.com`; cadastrar `foo@x.com` depois → 409; conta antiga com caixa mista continua entrando | Novo (regra) |
| REQ-AUTH-16 | Se a senha informada no cadastro ou na atualização passa de 72 bytes, o sistema deve responder 400. | 73 bytes → 400; 72 → aceita | Novo (regra) |
| REQ-AUTH-17 | Quando o login redireciona por `?next=`, o sistema deve aceitar apenas caminho local (começa com uma única `/`); qualquer outro valor leva a `/`. | `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:…` → `/` | Novo (regra) |
| REQ-CHAT-08 | Se o `historico` do chat tem mais de 20 itens, ou algum texto passa de 2000 caracteres, o sistema deve responder 400; a chave do Gemini não deve ir na URL. | 21 itens → 400; a chamada ao Gemini leva a chave no cabeçalho `x-goog-api-key`, sem `key=` na URL | Novo (regra) |
| REQ-CHAT-09 | Se a chamada ao Gemini lança erro ou excede o tempo limite, o chat deve responder 502. | `fetch` que lança → 502 (não 500) | Novo |
| REQ-SCAN-09 | O sistema deve aplicar tempo limite às chamadas ao Azure e ao Gemini e tratar o estouro como falha da dependência (REQ-SCAN-05 e REQ-SCAN-07). | Chamada que não responde é abortada no tempo limite; o scan devolve contingência (Gemini) ou 422 (Azure) | Novo |

REQ-SCAN-05 (Gemini falha por rede → 200 com contingência) já existia; esta spec corrige o código e remove o `todo` do teste.

## Cenários e casos-limite

- **`id`:** só dígitos, sem sinal, sem zeros à esquerda e até 2.147.483.647 (inteiro de 4 bytes do Postgres). `1e3`, `1.5`, ` 7`, `007`, `0`, vazio e números maiores são inválidos.
- **Ordem em `usuarios/[id]`:** primeiro a sessão e a posse (401/403), depois o `id` (400); um usuário comum que passa um `id` inválido recebe 403, sem revelar nada.
- **E-mail antigo com caixa mista:** o login e a checagem de duplicidade comparam ignorando a caixa; não há migration. Duas contas antigas que só diferem pela caixa não são tocadas.
- **Cadastro simultâneo do mesmo e-mail:** a restrição única do banco decide; o erro P2002 vira 409 "Email já cadastrado".
- **Limites do chat:** 20 itens, 2000 caracteres por texto e 5 partes por item são limites escolhidos por esta spec (espelham o limite de `mensagem`); ajustáveis se o uso real pedir.
- **Tempos limite:** Azure 10 s e Gemini 20 s são valores iniciais escolhidos por esta spec, sem medição ❔; ficam em constantes nomeadas.

## Regras de negócio e restrições

- Constitution Art. VI.1 (validar params), Art. VII.1–2 e 4 (erros de domínio tipados, sem `message.includes`, FK → 409), Art. VIII.2 (timeout em toda chamada de rede).
- Mensagens e códigos HTTP já existentes não mudam: o que muda é a origem da decisão (tipo do erro) e os casos que hoje viram 500.
- Não altera nenhum ADR Aceito.

## Interfaces afetadas

`lib/errors/dominio.ts` (novo) · `lib/http/responses.ts` · `lib/http/params.ts` e `lib/schemas/id.ts` (novos) · `lib/http/fetch-com-timeout.ts` (novo) · `lib/http/next-url.ts` (novo) · `lib/schemas/usuario.ts` · `lib/schemas/ia-chat.ts` · `lib/ai/providers/*.ts` · `services/{usuario,marca,categoria,certificado}.service.ts` · handlers de `produtos`, `usuarios`, `marcas`, `categorias`, `certificados`, `auth`, `users`, `ia/chat` · `app/(auth)/sign-in/page.tsx`.

## Delta na spec viva

Novos REQs nas oito capacidades acima, com linhas em cada `status.md`; `ecoscan/status.md`: REQ-SCAN-05 ◐→✅ quando o teste passar.

## Perguntas em aberto

Nenhuma bloqueante. Os limites do chat e os tempos limite (valores acima) podem ser revistos com dados de uso.
