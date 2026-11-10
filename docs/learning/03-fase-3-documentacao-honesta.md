# Fase 3 · Documentação honesta

**O que mudou:** o README tinha promessas que o código não cumpre (e-commerce com carrinho, filtro por marca, galeria, credenciais de seed, `SameSite=Strict`). Foi reescrito enxuto; o original ficou em `docs/discovery/2026-11-baseline/`.

**Lição:** documentação de intenção e documentação de comportamento são coisas diferentes. A spec viva só vale se cada linha diz o que o código faz hoje (status ✅ ◐ ❌ ❔) e prova com evidência. O README passou a apontar para ela em vez de competir com ela.

**Também:** `prisma/schema.txt` (cópia duplicada do schema) foi removido e `.gitignore` deixou de ignorar `prisma/migrations/**/*.sql`, que precisam ser versionadas.
