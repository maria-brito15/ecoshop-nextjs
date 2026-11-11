# Spec de mudança: 004-chat-flutuante

- **Trilha:** correção (o código viola REQ-CHAT-06; a regra já existe na spec, só faltava a UI)
- **Capacidades afetadas:** CHAT (`docs/capabilities/chat-sustentabilidade`)
- **Status:** Consolidada
- **Autor / aprovador:** Claude / Arthur (G1: escolheu "botão flutuante" entre as duas opções em 2026-11-10, resolvendo a pergunta aberta #1 da spec) · **Data:** 2026-11-10

## Problema

`POST /api/ia/chat` já funciona de ponta a ponta (REQ-CHAT-01 a 05, 07, todos ✅: autenticação, rate limit, validação, fallback de erro do Gemini). Só não existe nenhuma tela que o use — REQ-CHAT-06 está ❌. A spec deixava aberto se a interface seria uma página própria ou um botão flutuante; o dono decidiu botão flutuante, visível em qualquer página.

## Fora de escopo

- Qualquer mudança no backend do chat (`app/api/ia/chat/route.ts`, `lib/schemas/ai-chat.ts`): já funciona e está fora de escopo.
- Persistir a conversa no servidor (já é "fora de escopo" explícito na spec viva).
- Decidir o escopo do EcoScan/Azure (P06 também cita isso, mas é uma capacidade separada — `ecoscan`, já implementada).

## Comportamento atual (fato, com evidência)

- `app/api/ia/chat/route.ts`: endpoint completo, testado (`tests/integration/chat-ai.test.ts`), aceita `{ mensagem, historico? }` e devolve `{ resposta }`.
- `lib/hooks/useAI.ts:45-47` (`useChat`): hook de mutation já pronto para esse endpoint.
- Nenhum componente de UI chamava `useChat` antes desta mudança.
- `docs/capabilities/chat-sustentabilidade/status.md`: REQ-CHAT-06 ❌.

## Requisitos

| ID | Requisito (EARS) | Critério de aceite | Novo / Altera |
|---|---|---|---|
| REQ-CHAT-06 | Quando um usuário autenticado abre o chat, o sistema deve oferecer uma interface para conversar. | Botão flutuante visível em qualquer página para quem tem sessão; abre painel com histórico da conversa e campo de mensagem | Já existe (❌→◐, ver nota de verificação) |

## Cenários e casos-limite

- Visitante sem sessão: o botão flutuante não aparece (a página chama `GET /api/auth/me`; sem sessão, `res.ok` é falso).
- Usuário excede 20 mensagens/min (REQ-CHAT-02): a tela mostra o erro devolvido pela API (`429`) na área de erro do painel.
- Gemini indisponível (REQ-CHAT-03/04): a tela mostra o erro devolvido (`503`/`502`), sem travar o input.
- Recarregar a página: o histórico da conversa se perde (consistente com "contexto não persistido no servidor").

## Regras de negócio e restrições

- Nenhuma nova; reaproveita BR-CHAT-01 (rate limit) e BR-CHAT-02 (tamanho da mensagem), ambas já impostas pelo backend.
- `ui.md`: a tela mostra a mensagem `erro` devolvida pela API, não um texto genérico.
- Constitution Art. XI: nenhum dado inventado — a resposta exibida é sempre a devolvida pelo Gemini via API.

## Interfaces afetadas

`app/components/FloatingChat.tsx` (novo) · `app/layout.tsx` (monta o componente para todas as páginas).

## Delta na spec viva

`chat-sustentabilidade/status.md`: REQ-CHAT-06 ❌→◐ (código implementado; falta verificação visual no navegador). `chat-sustentabilidade/spec.md`: resolve a pergunta aberta #1 (botão flutuante).

## Perguntas em aberto

Nenhuma bloqueante.
