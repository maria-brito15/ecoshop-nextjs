# Plano: 004-chat-flutuante

- **Spec:** ./spec.md
- **ADRs que segue:** ADR-0012 (IA em duas etapas / modelo Gemini) · **ADRs novos/que substitui:** nenhum

## Abordagem técnica

Novo componente `app/components/FloatingChat.tsx` ("use client"), montado no `app/layout.tsx` ao lado do `<Header />` para aparecer em todas as páginas. Ele:
1. Checa sessão com `GET /api/auth/me` (mesmo padrão do `useSession` interno do `Header.tsx`); sem sessão, não renderiza nada (`return null`).
2. Mantém `mensagens` (histórico local, não persistido) e usa `useChat()` (`lib/hooks/useAI.ts`, já existente) para chamar `POST /api/ia/chat`, convertendo o histórico local para o formato `{ role, parts: [{ text }] }` que a API espera.
3. Mostra o erro devolvido pela API (`chat.erro`) em vez de um texto genérico (`ui.md`).

Alternativa descartada: hook de sessão compartilhado extraído de `Header.tsx`. Rejeitada para esta mudança por aumentar o escopo (refatorar `Header.tsx` não é necessário só para o chat); o componente novo faz sua própria checagem leve, do mesmo jeito que `Header.tsx` já faz.

## Constitution Check

| Artigo | Aplica? | Cumprido? | Observação |
|---|---|---|---|
| II Testes por REQ | sim | parcial | backend já 100% testado (REQ-CHAT-01 a 05, 07); UI sem suíte de componente no projeto (ADR-0016 cobre só API) — falta manual no navegador |
| III Autorização | sim | sim | a UI só chama a API, que já exige sessão (`requireAuth`); a UI some sem sessão, mas a decisão de acesso real continua no handler |
| V Camadas | sim | sim | componente só consome `useChat`/`fetch`, nenhuma chamada direta a `lib/db` |
| VII Erros | sim | sim | exibe `chat.erro` (o campo `erro` da API) |
| XI Sem dado inventado | sim | sim | só mostra texto vindo da API |

## Arquivos afetados

| Arquivo | Mudança | REQ |
|---|---|---|
| `app/components/FloatingChat.tsx` (novo) | botão flutuante + painel de chat | REQ-CHAT-06 |
| `app/layout.tsx` | monta `<ChatFlutuante />` | REQ-CHAT-06 |
| `docs/capabilities/chat-sustentabilidade/{spec,status}.md` | REQ-CHAT-06 ❌→◐; resolve pergunta aberta #1 | REQ-CHAT-06 |
| `docs/architecture/adr/pendentes.md` | remove a linha do chat do backlog | — |

## Plano de verificação

API: REQ-CHAT-01 a 05, 07 já cobertas por `tests/integration/chat-ai.test.ts`, sem alteração. Manual pendente: abrir qualquer página autenticado, ver o botão flutuante, enviar mensagem e receber resposta; deslogado, confirmar que o botão não aparece — não feito nesta sessão por falta de ferramenta de navegador.

## Riscos e reversão

Risco: o componente aparecer para visitantes sem sessão e falhar ao enviar. Mitigado por checar `GET /api/auth/me` antes de renderizar. Reversão: remover a linha `<ChatFlutuante />` de `app/layout.tsx` (o componente não altera nenhum outro arquivo).

## Complexity Tracking

Sem violações.
