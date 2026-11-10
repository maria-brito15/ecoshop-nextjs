# Restrições do sistema

| Restrição | Origem | Tipo |
|---|---|---|
| Next.js 15 (App Router), React 19, TypeScript estrito | `package.json` | Escolha atual (ADR-0003) — pode ser revisada por ADR |
| PostgreSQL 16 + Prisma 7 | ADR-0006 | Escolha atual |
| Redis é opcional | ADR-0010 | Escolha atual |
| Node 22 (Docker, CI e `.nvmrc`) | Dockerfile | Padronizada no ADR-0015/CI |
| Idioma pt-BR na interface e no domínio | ADR-0014 | Escolha |
| Hospedagem em VPS com Docker Compose | ADR-0013 | Escolha (sem produção ainda) |
| Dependência de terceiros pagos: Azure Custom Vision e Gemini | `lib/ai` | **Restrição real**: custo e disponibilidade fora do nosso controle |
| Projeto mantido por uma pessoa, finalidade de portfólio e aprendizado | dono | Contexto: processos devem ser proporcionais |
