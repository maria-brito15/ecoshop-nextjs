# External interfaces

| System | Use | Contract used | Failure today | Pending |
|---|---|---|---|---|
| Azure Custom Vision | Classify the photo | `POST {AZURE_VISION_ENDPOINT}` with `Prediction-Key`, binary body; response `predictions[{tagName, probability}]` | Any error → `null` → "no prediction" response (422) | Document the model's **tags** (few today; `outros` = not identified). No timeout |
| Google Gemini (`gemini-2.0-flash`) | Analysis text and chat | `POST v1beta/models/{model}:generateContent?key=…` (key in the query string) | Non-OK response → `null` → fallback; **a network error throws an exception → 500 in the scan (D4)**; chat returns 502 | Move the key to a header; timeout; check that the model is still available |
| PostgreSQL | Persistence | Prisma | Error → 500 | — |
| Redis | Cache and rate limit | `redis` v4 | Silenced (fail-open) | ADR-P04 |
| Filesystem (`public/data_fotos`) | Photos | `fs` | `readdir` fails → empty list | ADR-P03 |
