# AUTZ · Autorização (quem pode o quê)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0017 · ADR-0008 (histórico, substituído)

## Objetivo

Definir, em um só lugar, quais papéis podem executar cada ação em cada recurso, e como o sistema nega o que não é permitido. É a matriz que o middleware e os handlers implementam (ADR-0017).

## Atores

Visitante (sem sessão) · CLIENTE · MARCA (hoje sem direitos além de CLIENTE) · ADMIN.

## Regras de negócio

- **BR-AUTZ-01** — Negar por padrão: o que não está explicitamente permitido é negado (proposto; ver REQ-AUTZ-07).
- **BR-AUTZ-02** — 401 = sem sessão válida; 403 = sessão válida sem permissão.
- **BR-AUTZ-03** — A decisão de acesso por recurso mora no handler; o middleware autentica e restringe páginas administrativas (ADR-0017).

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-AUTZ-01 | Quando uma requisição de escrita (criar, alterar, excluir) chega a produtos, categorias, marcas, certificados ou fotos de produto, o sistema deve exigir sessão de ADMIN: 401 sem sessão e 403 para outro papel. | POST em cada rota sem cookie → 401; com cookie de CLIENTE → 403 |
| REQ-AUTZ-02 | Quando um visitante lê produtos ou categorias, o sistema deve permitir a leitura sem sessão. | GET /api/produtos e /api/categorias sem cookie → 200 |
| REQ-AUTZ-03 | Quando alguém aciona o scan ou o chat de IA, o sistema deve exigir sessão (qualquer papel). | POST sem cookie em /api/ia/scan e /api/ia/chat → 401 |
| REQ-AUTZ-04 | Quando alguém lista ou cria usuários, o sistema deve exigir sessão de ADMIN. | GET /api/usuarios: 401 sem cookie, 403 para CLIENTE |
| REQ-AUTZ-05 | Quando alguém lê ou altera /api/usuarios/[id], o sistema deve permitir apenas o próprio usuário ou um ADMIN, e deve permitir excluir apenas a um ADMIN. | CLIENTE A lê A → 200; lê B → 403; altera B → 403; exclui A → 403; ADMIN lê A → 200 |
| REQ-AUTZ-06 | Quando uma requisição chega ao middleware, o sistema deve exigir sessão em /perfil e em /api/usuarios (redirecionar a /sign-in?next= para páginas e responder 401 JSON para a API) e deve exigir ADMIN em /painel (redirecionar a / para outros papéis). | middleware(/perfil) sem cookie → 307 para /sign-in?next=%2Fperfil; /api/usuarios/1 sem cookie → 401; /painel com CLIENTE → 307 para / |
| REQ-AUTZ-07 | Se uma rota de API não declara sua política de acesso, o sistema deve negá-la por padrão. | Existe teste que percorre todas as rotas de app/api e falha para rota sem política declarada |
| REQ-AUTZ-08 | Quando um visitante abre a página /ia-scan, o sistema deve redirecioná-lo ao login. | /ia-scan sem sessão → redirecionamento a /sign-in?next=/ia-scan |

## Casos-limite

Token expirado ou adulterado equivale a sem sessão (401). Papel MARCA hoje é tratado como CLIENTE em todas as rotas. Prefixo `/api/admin` está nas regras do middleware, mas essa rota não existe.

## Interfaces

Matriz de acesso efetiva (verificada por REQ-AUTZ-01 a 06):

| Recurso | Visitante | CLIENTE / MARCA | ADMIN |
|---|---|---|---|
| GET produtos, categorias, marcas, certificados, fotos | ✅ | ✅ | ✅ |
| POST/PUT/DELETE produtos, categorias, marcas, certificados, fotos | 401 | 403 | ✅ |
| GET/POST /api/usuarios | 401 | 403 | ✅ |
| GET/PUT /api/usuarios/[id] | 401 | só o próprio | ✅ |
| DELETE /api/usuarios/[id] | 401 | 403 | ✅ |
| POST /api/ia/scan, /api/ia/chat | 401 | ✅ | ✅ |
| Página /perfil | redireciona ao login | ✅ | ✅ |
| Página /painel | redireciona ao login | redireciona a / | ✅ |

## NFRs aplicáveis

NFR-SEG-04 (negar por padrão).

## Fora de escopo

Papéis novos; permissões por marca (MARCA gerir os próprios produtos) — depende da definição do papel (ver overview).

## Perguntas abertas

1. A página /ia-scan deve exigir login antes de abrir (REQ-AUTZ-08) ou continuar pública com erro ao enviar?
2. O que o papel MARCA pode fazer? Enquanto não houver resposta, MARCA = CLIENTE.
