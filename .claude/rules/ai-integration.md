---
paths: ["lib/ai/**", "app/api/ia/**"]
---
- Chamadas externas (Azure, Gemini) com tratamento de falha explícito e contingência definida na spec (SCAN/CHAT).
- Rotas de IA exigem sessão e, no chat, rate limit por usuário.
- Nunca registre chaves em log nem as exponha ao cliente. Mudança relevante cita ADR-0012.
