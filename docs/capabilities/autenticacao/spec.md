# AUTH · Autenticação (cadastro, login, sessão)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0018 · ADR-0020 · ADR-0021

## Objetivo

Permitir que uma pessoa crie conta, entre, saia e mantenha uma sessão segura, com proteção contra tentativas em massa.

## Atores

Visitante · CLIENTE · MARCA · ADMIN (criado apenas por ADMIN ou pelo seed).

## Regras de negócio

- **BR-AUTH-01** — E-mail é único por usuário.
- **BR-AUTH-02** — ADMIN não pode ser criado pelo cadastro público.
- **BR-AUTH-03** — Senha tem ao menos 8 caracteres e é guardada com bcrypt (12 rounds).
- **BR-AUTH-04** — Cadastro como MARCA exige aprovação de um ADMIN; enquanto pendente, o usuário tem os direitos de CLIENTE (decisão do dono, 2026-11-10; modelo em ADR-0018).

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-AUTH-01 | Quando credenciais válidas são enviadas ao login, o sistema deve responder 200 e definir o cookie de sessão `token` como httpOnly e SameSite=lax. | POST /api/auth válido → 200, cabeçalho set-cookie com token, HttpOnly, SameSite=lax; corpo sem senha |
| REQ-AUTH-02 | Se o e-mail não existe ou a senha está errada, o sistema deve responder o mesmo 401, sem revelar qual dos dois falhou. | As duas respostas têm status 401 e corpo idêntico |
| REQ-AUTH-03 | Se o corpo do login é inválido, o sistema deve responder 400. | e-mail malformado e senha vazia → 400 |
| REQ-AUTH-04 | Se um mesmo IP faz mais de 10 tentativas de login em 1 minuto, o sistema deve responder 429. | A 11ª tentativa em 60 s → 429; as 10 primeiras não |
| REQ-AUTH-05 | Quando o cadastro público é válido, o sistema deve criar um usuário CLIENTE (padrão), iniciar a sessão e responder 201. | POST /api/users → 201, tipo CLIENTE, set-cookie token |
| REQ-AUTH-06 | Se o e-mail do cadastro já existe, o sistema deve responder 409. | Cadastro com e-mail existente → 409 |
| REQ-AUTH-07 | O sistema nunca deve incluir a senha ou seu hash em respostas sobre usuários (login, cadastro, criação e atualização por ADMIN). | As respostas de login, cadastro, POST /api/usuarios e PUT /api/usuarios/[id] não contêm o campo senha |
| REQ-AUTH-08 | Se o cadastro público pede o tipo ADMIN, o sistema deve responder 400. | POST /api/users com tipo ADMIN → 400 |
| REQ-AUTH-09 | Quando o usuário sai, o sistema deve remover o cookie de sessão. | DELETE /api/auth → 200 e set-cookie expirando token |
| REQ-AUTH-10 | Quando a sessão é válida, o sistema deve devolver os dados do usuário em /api/auth/me; sem sessão, deve responder 401. | GET /api/auth/me com e sem cookie |
| REQ-AUTH-11 | Quando alguém se cadastra como MARCA, o sistema deve registrar o pedido como pendente (usuário CLIENTE + `Marca` com status PENDENTE) e conceder os direitos de MARCA somente após aprovação de um ADMIN. | Cadastro com tipo MARCA não resulta em usuário MARCA até aprovação; `Marca.status === "PENDENTE"` |
| REQ-AUTH-12 | Se a senha do cadastro tem menos de 8 caracteres, o sistema deve responder 400. | POST /api/users com senha de 7 caracteres → 400 |
| REQ-AUTH-13 | Quando um usuário é excluído ou tem o papel alterado, o sistema deve encerrar ou invalidar suas sessões existentes em prazo a definir. | Token emitido antes da exclusão deixa de valer em até N minutos (N a decidir) |
| REQ-AUTH-14 | Se o cadastro pede `tipo: "MARCA"` sem o nome da marca, o sistema deve responder 400. | POST /api/users com tipo MARCA e sem `marcaNome` → 400 |
| REQ-AUTH-15 | O sistema deve normalizar o e-mail (remover espaços das pontas e converter para minúsculas) no cadastro, no login e na atualização, e buscar usuários ignorando a diferença de caixa; ao cadastrar MARCA com nome de marca já existente, deve responder 409. | Cadastrar `Foo@X.com` grava `foo@x.com`; cadastrar `foo@x.com` depois → 409; conta antiga com caixa mista continua entrando |
| REQ-AUTH-16 | Se a senha informada no cadastro ou na atualização passa de 72 bytes (limite útil do bcrypt), o sistema deve responder 400. | 73 bytes → 400; 72 → aceita; `ç` × 37 (74 bytes) → 400 |
| REQ-AUTH-17 | Quando o login redireciona por `?next=`, o sistema deve aceitar apenas caminho local (começa com uma única `/`, sem `\` nem caracteres de controle); qualquer outro valor leva a `/`. | `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:…` → `/` |
| REQ-AUTH-18 | O JWT de acesso deve expirar em 15 minutos. | `exp` do token emitido ≈ agora + 900 s |
| REQ-AUTH-19 | Quando o login ou o cadastro tem sucesso, o sistema deve emitir também um token de renovação opaco (cookie `refresh`, 7 dias, guardado só como hash no Redis); renovar deve gastá-lo (uso único), reler o papel do usuário no banco e emitir um par novo; sem Redis, o login funciona sem renovação e a renovação responde 503. | Reusar um token → recusado; dois pedidos simultâneos → um renova; Redis fora → 503; admin rebaixado vira CLIENTE ao renovar |
| REQ-AUTH-20 | Quando o usuário faz logout, troca a senha ou é excluído, o sistema deve revogar os tokens de renovação (logout: o da sessão; troca de senha e exclusão: todos do usuário), sem falhar se o Redis estiver fora. | Após revogar, a renovação é recusada; sessões de outros usuários não são tocadas |
| REQ-AUTH-21 | Quando o usuário troca a PRÓPRIA senha, o sistema deve exigir `senhaAtual` correta (403 "Senha atual incorreta"); um ADMIN trocando a de outro usuário não precisa. | Sem `senhaAtual` ou errada → 403; certa → 200 |
| REQ-AUTH-22 | Quando uma página protegida recebe um acesso expirado mas há token de renovação, o sistema deve renovar e voltar para a mesma página; falhando, levar ao login com `next`. | Middleware redireciona para `/api/auth/refresh?next=/perfil?aba=2` |
| REQ-AUTH-23 | O login deve executar a comparação do bcrypt mesmo quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails têm conta. | Tempo com e-mail inexistente é da mesma ordem que com e-mail existente |

## Casos-limite

Sem Redis o limite de tentativas continua valendo por instância, com contador em memória (ADR-0020). O IP do cliente é a N-ésima entrada, contada do fim, de x-forwarded-for (N = TRUST_PROXY_HOPS, padrão 1; REQ-OPS-16); com N = 0 o cabeçalho é ignorado.

## Interfaces

POST/DELETE /api/auth · POST /api/users · GET /api/auth/me · POST e GET /api/auth/refresh (renova a sessão com o cookie `refresh`; sem ele, reemite o token quando o tipo no banco difere). Cookies `token` (JWT HS256, 15 minutos) e `refresh` (opaco, 7 dias, uso único, revogável; ADR-0021).

## NFRs aplicáveis

NFR-SEG-01, NFR-SEG-02, NFR-SEG-03.

## Fora de escopo

Recuperação de senha, verificação de e-mail, login social, MFA.

## Perguntas abertas

1. Qual duração e política de revogação de sessão (P02)?
