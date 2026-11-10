# Fase 7 · Piloto: `specs/001-perfil-proprio-usuario`

**Defeito:** CLIENTE/MARCA não via o próprio perfil (D1): o middleware exigia ADMIN em `/api/usuarios`, mas o handler já aceitava "o próprio ou ADMIN".

**Percurso (trilha correção):** teste de caracterização `todo` → spec/plano/tarefas → mudança de 1 linha em `config/rotas-protegidas.ts` (middleware só autentica; handler decide, ADR-0017) → `todo` removido → status ❌→✅ → `sdd:check` verde. Também corrigido D8: a tela lia `data.mensagem`, a API envia `erro`.

**O que o piloto mostrou:** o ADR-0017 (decisão no handler) tornou a correção segura e pequena; sem testes de autorização (AUTZ-04/05) o risco de abrir `/api/usuarios` a qualquer logado seria difícil de avaliar.

**Pendente:** verificação manual de REQ-PERF-04 na tela (precisa de navegador).
