# AUTH · Autenticação (cadastro, login, sessão)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0007 · ADR-0010

## Objetivo

Permitir que uma pessoa crie conta, entre, saia e mantenha uma sessão segura, com proteção contra tentativas em massa.

## Atores

Visitante · CLIENTE · MARCA · ADMIN (criado apenas por ADMIN ou pelo seed).

## Regras de negócio

- **BR-AUTH-01** — E-mail é único por usuário.
- **BR-AUTH-02** — ADMIN não pode ser criado pelo cadastro público.
- **BR-AUTH-03** — Senha tem ao menos 8 caracteres e é guardada com bcrypt (12 rounds).
- **BR-AUTH-04** — Proposta (decisão do dono, 2026-11-10): cadastro como MARCA exige aprovação de um ADMIN; enquanto pendente, o usuário tem os direitos de CLIENTE.

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
| REQ-AUTH-11 | Quando alguém se cadastra como MARCA, o sistema deve registrar o pedido como pendente e conceder os direitos de MARCA somente após aprovação de um ADMIN. | Cadastro com tipo MARCA não resulta em usuário MARCA até aprovação |
| REQ-AUTH-12 | Se a senha do cadastro tem menos de 8 caracteres, o sistema deve responder 400. | POST /api/users com senha de 7 caracteres → 400 |
| REQ-AUTH-13 | Quando um usuário é excluído ou tem o papel alterado, o sistema deve encerrar ou invalidar suas sessões existentes em prazo a definir. | Token emitido antes da exclusão deixa de valer em até N minutos (N a decidir) |

## Casos-limite

Sem Redis o limite de tentativas não é aplicado (fail-open, ADR-0010). O IP vem de x-forwarded-for; atrás de proxy não confiável pode ser forjado. O README afirma SameSite=Strict; o código usa lax (a spec segue o código).

## Interfaces

POST/DELETE /api/auth · POST /api/users · GET /api/auth/me · POST /api/auth/refresh (reemite o token quando o tipo no banco difere do token). Cookie `token`, JWT HS256, 7 dias.

## NFRs aplicáveis

NFR-SEG-01, NFR-SEG-02, NFR-SEG-03.

## Fora de escopo

Recuperação de senha, verificação de e-mail, login social, MFA.

## Perguntas abertas

1. Qual duração e política de revogação de sessão (P02)?
2. Qual a mensagem exibida a quem se cadastra como MARCA enquanto pendente (REQ-AUTH-11)?
