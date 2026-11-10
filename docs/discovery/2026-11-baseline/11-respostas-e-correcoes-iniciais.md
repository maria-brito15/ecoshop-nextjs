# 11 · Respostas da Fase 0 e correções iniciais (D2 e D3)

## 1. Suas respostas e o que mudam no plano

| # | Pergunta | Resposta | Impacto |
|---|---|---|---|
| 1 | Vitrine ou e-commerce? | **Vitrine/catálogo** | `docs/product/overview.md` declara carrinho, pedido, pagamento e estoque como **fora de escopo**. O README deve parar de chamar o projeto de "e-commerce" (Fase 3). |
| 2 | Papel MARCA pode ser escolhido no cadastro? | **Sim, mas depende de aprovação** | Novo requisito a especificar (AUTH/AUTZ): cadastro como MARCA fica **pendente** até um ADMIN aprovar; enquanto pendente, o usuário tem os direitos de CLIENTE. **Não existe hoje** (o cadastro já cria MARCA direto). Exige decisão de modelo (campo de status do usuário/marca) e ADR. Candidata à primeira spec de mudança depois do piloto. |
| 3 | Chat de IA | **Fica e ganha UI** | CHAT deixa de ser "decisão" e vira capacidade a especificar, com UI, autenticação e limite de uso. Exige spec de mudança (trilha completa) para a tela. |
| 4 | Métricas da home e "impacto" por produto | **Ilustrativas hoje; quer fonte real** | Até haver fonte: rotular como ilustrativo (Art. XI). Spec de CONT precisa de uma pergunta aberta "qual fonte de dado real?" (ex.: calcular de dados do catálogo, ou de dados de impacto por categoria/material). Sem essa fonte não há requisito verificável. |
| 5 | Em produção? | **Ainda não** | Opção B do doc 10 vale para o resto; ADR de sessão (P02) e mídia (P03) podem ser decididos sem medo de migração de dados reais. É o melhor momento para corrigir seed (D5/D6). |
| 6 | Logs do Actions / git com histórico | **Sim** | Preciso deles para: confirmar se o CI falha no lint (D10) e datar os ADRs inferidos. Se puder, envie o log da última execução do workflow e um `git log --oneline --date=short` (ou o zip com `.git`). |
| 7 | Tags do modelo Azure documentadas? | **Não (poucas tags)** | A spec SCAN lista as tags reconhecidas como **pergunta aberta** e como interface externa a documentar. Hoje só sabemos de `outros` pelo código. Sugestão: exportar a lista de tags do Custom Vision para `docs/product/interfaces-externas.md`. |
| 8 | Constitution | **Não sabe** | Recomendo **aprovar como está** (v1.0.0) e revisitar ao fim da Fase 4: é mais fácil cortar um princípio que nunca foi usado do que adivinhar agora. Os três mais prováveis de gerar atrito são XIII (observabilidade), XIV.2 (limite de 300 linhas) e IX (cache). Se quiser, marco esses três como "aviso" em vez de "bloqueante" até lá. |
| 9 | D2/D3 | **Corrigir já** | Feito neste documento (seção 2). |

## 2. Correções aplicadas (patch sobre a cópia local)

Patch: [`patches/0001-corrige-D2-hash-de-senha-e-D3-chat-publico.patch`](patches/0001-corrige-D2-hash-de-senha-e-D3-chat-publico.patch) (formato git; `git apply` na raiz do projeto).

Seguiu a trilha "Correção" do doc 03: teste que falha primeiro, depois a correção.

### D2 · hash da senha na resposta
- **Teste antes da correção:** falhou nos dois casos. Achado extra: `POST /api/usuarios` (criar usuário como admin) **também** devolvia o hash, não só o `PUT`.
- **Correção:** `services/usuario.service.ts` passa a usar uma projeção única `USUARIO_PUBLICO` (sem `senha`) em criar, atualizar, listar e buscar.
- **Não mudou:** contrato de resposta (mesmos campos de antes, menos `senha`).

### D3 · chat de IA público
- **Teste antes da correção:** falhou (sem login a rota respondia 503, ou seja, chegava até a checagem da chave do Gemini).
- **Correção:** `app/api/ia/chat/route.ts` exige login (`requireAuth`, 401) e limita **20 mensagens por minuto por usuário** (429), via o `rateLimit` existente.
- **Decisões minhas que você pode mudar:** exigir login (o scan já exige) e o limite de 20/min. Estão como constantes no topo do arquivo.
- **Pendente:** a UI do chat (resposta 3) é uma mudança nova pelo fluxo completo, não faz parte deste patch.

### Testes
- Novo script `npm run test:integration` usando o runner nativo do Node via `tsx` (já é dependência), **sem adicionar pacote**. É provisório: a escolha da ferramenta de teste definitiva é o ADR-P08.
- 5 testes: 5 passam depois da correção (4 falhavam antes; o 5º, "autenticado sem chave → 503", já passava e protege contra regressão).
- Precisam de Postgres (`DATABASE_URL`, migrations aplicadas) e Redis (`REDIS_URL`) em execução. Rodei com instâncias locais descartáveis.
- Verificações: `tsc --noEmit` passa; `next build` passa; patch aplica limpo sobre o zip original.

### O que este patch **não** faz (propositalmente)
- Não corrige D1 (perfil para não-admin): exige a decisão ADR-P01 sobre onde mora a autorização; é o piloto da Fase 7.
- Não mexe em CI/lint (Fase 1), seed (D5/D6) nem em nenhum outro defeito.
- Não atualiza specs nem ADRs: elas ainda não existem; ao fim da Fase 5, REQ-AUTH/PERF (sem senha) e REQ-CHAT (acesso e limite) apontam para estes testes.
