# Requisitos não funcionais (NFR)

Atravessam as capacidades. As specs de capacidade **referenciam** estes IDs, não os repetem. Status: ✅ cumprido e testado · ◐ parcial/sem teste · ❌ não cumprido · ❔ não verificado.

| ID | Requisito | Verificação | Status |
|---|---|---|---|
| NFR-SEG-01 | Hash de senha, tokens e chaves de API nunca saem do servidor (respostas, logs, URLs) | Testes de contrato; revisão | ◐ (resposta de usuário ✅; chave Gemini ainda vai em query string) |
| NFR-SEG-02 | Tentativas de login limitadas por IP (10/min) e cadastro (5/h) | Teste com Redis | ◐ |
| NFR-SEG-03 | Cookie de sessão httpOnly, `secure` em produção, `sameSite=lax` | Teste do header | ◐ |
| NFR-SEG-04 | Rotas sem política declarada são negadas por padrão | Teste da matriz | ❌ |
| NFR-DISP-01 | Sem Redis, leitura funciona direto do banco | Teste com Redis simulado em falha | ◐ |
| NFR-DISP-02 | Falha ou lentidão de Azure/Gemini nunca derruba a requisição com 500 quando há comportamento especificado | Testes de adaptador | ❌ (D4) |
| NFR-DISP-03 | Toda chamada de rede externa tem timeout | Revisão/teste | ❌ |
| NFR-CONS-01 | Mutação de uma entidade invalida caches que a embutem | Testes "mutação → leitura" | ❌ (marca → produtos) |
| NFR-DES-01 | Listagens limitam o tamanho de página (≤ 100) | Teste | ❌ (D9) |
| NFR-OPS-01 | Seeds nunca apagam dados em ambiente compartilhado e são idempotentes | Revisão/teste | ❌ (D5) |
| NFR-OPS-02 | Um ambiente novo sobe com um administrador utilizável | Teste manual/CI | ❌ (D6) |
| NFR-OPS-03 | `/api/health` distingue dependência obrigatória (banco) de opcional (Redis) | Teste | ❌ |
| NFR-A11Y-01 | Contraste e navegação por teclado nas telas principais | — | ❔ (não verificado) |
| NFR-PRIV-01 | Conteúdo gerado por IA é identificado como tal na interface | Revisão | ❔ |
