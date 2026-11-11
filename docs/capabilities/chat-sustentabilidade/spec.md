# CHAT · Chat de sustentabilidade

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0012

## Objetivo

Responder perguntas de usuários autenticados sobre sustentabilidade usando o Gemini, com um botão flutuante de chat visível em qualquer página.

## Atores

Usuário autenticado (qualquer papel).

## Regras de negócio

- **BR-CHAT-01** — Limite de 20 mensagens por minuto por usuário.
- **BR-CHAT-02** — Mensagem tem de 1 a 2000 caracteres.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-CHAT-01 | Quando um usuário autenticado envia uma mensagem válida, o sistema deve devolver a resposta do Gemini. | POST /api/ia/chat → 200 com a resposta |
| REQ-CHAT-02 | Se o usuário excede 20 mensagens por minuto, o sistema deve responder 429. | A 21ª mensagem em 60 s → 429 |
| REQ-CHAT-03 | Se a chave do Gemini não está configurada, o sistema deve responder 503. | Sem GEMINI_API_KEY → 503 |
| REQ-CHAT-04 | Se o Gemini falha, o sistema deve responder 502. | Gemini devolve erro → 502 |
| REQ-CHAT-05 | Se a mensagem é vazia ou tem mais de 2000 caracteres, o sistema deve responder 400. | "" e 2001 caracteres → 400 |
| REQ-CHAT-06 | Quando um usuário autenticado abre o chat, o sistema deve oferecer uma interface para conversar. | Há tela com campo de mensagem e histórico da conversa |
| REQ-CHAT-07 | Se um visitante sem sessão envia mensagem, o sistema deve responder 401. | POST sem cookie → 401 |
| REQ-CHAT-08 | Se o `historico` do chat tem mais de 20 itens, ou algum texto passa de 2000 caracteres, ou algum item tem mais de 5 partes, o sistema deve responder 400; a chave do Gemini deve ir no cabeçalho `x-goog-api-key`, nunca na URL. | 21 itens → 400; a chamada ao Gemini não tem `key=` na URL |
| REQ-CHAT-09 | Se a chamada ao Gemini lança erro ou excede o tempo limite, o chat deve responder 502 (como REQ-CHAT-04), não 500. | `fetch` que lança → 502 |

## Casos-limite

O contexto da conversa não é persistido no servidor. Corrigido em 2026-11-10: antes, o chat era público e sem limite (D3).

## Interfaces

POST /api/ia/chat · Gemini 2.0 Flash · `app/components/FloatingChat.tsx` (montado em `app/layout.tsx`).

## NFRs aplicáveis

NFR-SEG-05.

## Fora de escopo

Persistir conversas; chat em tempo real.

## Perguntas abertas

Nenhuma. A pergunta sobre onde o chat aparece foi resolvida em 2026-11-10 (botão flutuante, `specs/004-chat-flutuante/spec.md`).
