# Tarefas: 004-chat-flutuante

| ID | Tarefa | REQ | Depende de | Feito quando | OK |
|---|---|---|---|---|---|
| T1 | `app/components/FloatingChat.tsx`: checagem de sessão, histórico local, `useChat`, exibição de erro | REQ-CHAT-06 | — | código compila (`tsc`), lint sem erro novo | [x] |
| T2 | Montar `<ChatFlutuante />` em `app/layout.tsx` | REQ-CHAT-06 | T1 | aparece em todas as páginas | [x] |
| T3 | Verificar `POST /api/ia/chat` contra o dev server real, autenticado e sem sessão | REQ-CHAT-06 | T1 | `curl` confirma 401 sem sessão e que, autenticado, a requisição passa de auth/rate-limit/validação até a chamada ao Gemini | [x] |
| T4 | Consolidar `chat-sustentabilidade/{spec,status}.md`; remover linha do chat de `pendentes.md` | — | T1, T2 | `npm run sdd:check` passa | [x] |

## Nota

REQ-CHAT-06 fica ◐, não ✅: `curl` confirmou que sem sessão a API responde 401 (o widget também fica escondido nesse caso) e que, autenticado, a requisição chega até a chamada ao Gemini — mas essa chamada devolveu 502 neste ambiente (sem alterar `app/api/ia/chat/route.ts`, que não foi tocado nesta mudança; parece ser falta de acesso de saída à internet do sandbox, não um defeito do código). Sem navegador para o teste visual nem uma resposta real do Gemini confirmada, falta um `manual: AAAA-MM-DD` para virar ✅.
