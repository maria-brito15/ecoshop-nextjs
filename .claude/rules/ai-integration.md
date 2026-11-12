---
paths: ["lib/ai/**", "app/api/ai/**"]
---
- External calls (Azure, Gemini) with explicit failure handling and the fallback defined in the spec (SCAN/CHAT).
- AI routes require a session and, for chat, a per-user rate limit.
- Never log keys or expose them to the client. A relevant change cites ADR-0012.
