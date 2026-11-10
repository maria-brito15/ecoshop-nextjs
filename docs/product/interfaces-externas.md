# Interfaces externas

| Sistema | Uso | Contrato usado | Falha hoje | Pendência |
|---|---|---|---|---|
| Azure Custom Vision | Classificar a foto | `POST {AZURE_VISION_ENDPOINT}` com `Prediction-Key`, corpo binário; resposta `predictions[{tagName, probability}]` | Qualquer erro → `null` → resposta "nenhuma predição" (422) | Documentar as **tags** do modelo (hoje poucas; `outros` = não identificado). Sem timeout |
| Google Gemini (`gemini-2.0-flash`) | Texto da análise e chat | `POST v1beta/models/{modelo}:generateContent?key=…` (chave na query string) | Resposta não-OK → `null` → fallback; **erro de rede lança exceção → 500 no scan (D4)**; chat devolve 502 | Mover a chave para header; timeout; verificar se o modelo continua disponível |
| PostgreSQL | Persistência | Prisma | Erro → 500 | — |
| Redis | Cache e rate limit | `redis` v4 | Silenciado (fail-open) | ADR-P04 |
| Filesystem (`public/data_fotos`) | Fotos | `fs` | `readdir` falha → lista vazia | ADR-P03 |
