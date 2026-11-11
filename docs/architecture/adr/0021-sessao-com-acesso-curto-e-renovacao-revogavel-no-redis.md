# ADR-0021: Sessão com acesso curto (JWT, 15 min) e renovação opaca e revogável no Redis

- Status: Aceito
- Data: 2026-11-11
- Decisores: dono do projeto (opção "token curto + refresh" e "sem Redis a renovação é negada", 2026-11-11) e Claude
- Origem: nova (ratifica e substitui o ADR-0007)
- Capacidades: AUTH, AUTZ
- Substitui: ADR-0007

## Contexto

O ADR-0007 (Inferido): JWT HS256 de 7 dias em cookie httpOnly, sem revogação. A auditoria de 2026-11-11 mostrou que um admin rebaixado, um usuário excluído ou uma sessão sequestrada continuam valendo por até 7 dias, e que trocar a senha não encerra nenhuma sessão. O dono escolheu token de acesso curto com renovação revogável (P02) e, sem Redis, renovação negada. O projeto roda com uma instância.

## Problema

Como permitir revogar sessões e propagar mudança de papel sem consultar o banco a cada requisição?

## Alternativas

| Opção | Resolve | Custa | Bloqueia |
|---|---|---|---|
| A. JWT de acesso curto + token de renovação opaco no Redis (escolhida) | Revogação e releitura do papel a cada renovação; verificação do acesso continua sem rede | Depende do Redis para renovar; um cookie a mais; janela de até 15 min para acesso já emitido | — |
| B. Coluna de versão de sessão em `Usuario` | Revogação imediata sem Redis | Uma consulta ao banco por requisição autenticada (ou cache) | Verificação sem rede no middleware (edge) |
| C. Manter o ADR-0007 | Nenhuma mudança | Sem revogação por 7 dias | Qualquer resposta a sessão sequestrada |

## Decisão

Opção A.

- **Acesso:** JWT HS256, cookie `token`, 15 minutos (`lib/auth/constantes.ts`). Verificado sem consultar o Redis, inclusive no middleware.
- **Renovação:** 256 bits aleatórios, cookie `refresh` (httpOnly, `SameSite=lax`, `secure` em produção, 7 dias). No Redis só fica o hash SHA-256 (`refresh:<hash>` → id do usuário; `refresh_usuario:<id>` → conjunto de hashes).
- **Uso único (rotação):** renovar apaga o token com `GETDEL` e emite um par novo; dois pedidos simultâneos com o mesmo token renovam só um. O papel do usuário é relido do banco.
- **Revogação:** logout revoga o token da sessão; trocar a senha e excluir o usuário revogam todos os dele.
- **Sem Redis:** login funciona, sem token de renovação (a sessão vive 15 min); renovar responde 503 e limpa os cookies (o usuário entra de novo).
- **Páginas:** o middleware, ao ver acesso expirado com `refresh` presente, redireciona para `GET /api/auth/refresh?next=…`, que renova e volta (só caminho local).
- **Compatibilidade:** sessões anteriores (cookie `token` de 7 dias, sem `refresh`) continuam valendo até expirar; para elas o `POST /api/auth/refresh` mantém o comportamento antigo (reemite se o papel mudou).

## Justificativa

Troca disponibilidade do Redis para renovação (aceita pelo dono) por revogação real e por uma janela máxima conhecida (15 min) entre mudança de papel e efeito. O valor de 15 minutos é inicial, sem medição de uso ❔.

## Consequências

- Em ambiente com Redis instável, usuários logados são deslogados a cada 15 minutos.
- Acesso já emitido não é revogável antes de expirar (máx. 15 min).
- Trocar a PRÓPRIA senha exige `senhaAtual` (REQ-AUTH-21).
- Afeta: `lib/auth/**`, `services/sessao.service.ts`, `services/usuario.service.ts`, `app/api/auth/**`, `app/api/users/route.ts`, `middleware.ts`.

## Verificação

`tests/integration/sessao.test.ts`: serviço com armazém em memória; armazém real no Redis (hash, uso único, revogação); middleware; e, com banco, cookies do login e senha atual.
