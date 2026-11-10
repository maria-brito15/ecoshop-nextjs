# EcoShop — contexto para o Claude

Vitrine/catálogo de produtos sustentáveis (sem carrinho, pedido ou pagamento). Next.js 15 (App Router), React 19, TypeScript strict, Prisma 7 + Postgres, Redis, jose (JWT), Zod, Azure Custom Vision + Gemini.

## Fontes de verdade (leia antes de mudar comportamento)
- Regras do projeto: `.specify/memory/constitution.md` (não repita aqui).
- Comportamento atual por capacidade: `docs/capabilities/<cap>/spec.md` + `status.md`. Índice: `docs/capabilities/README.md`.
- Decisões: `docs/architecture/adr/` (índice no README; pendentes em `pendentes.md`).
- Contexto do sistema: `docs/product/`, `docs/architecture/overview.md`.
- Mudanças em andamento ou passadas: `specs/NNN-*/` (Spec Kit; imutáveis após o merge).
- Mapa código → capacidade e caminhos sensíveis → ADR: `sdd.config.json`.

## Fluxo
1. Classifique a trilha (completa / correção / correção com mudança de regra / sem comportamento) — ver `docs/guides/fluxo-sdd.md`.
2. Trilha completa: `specs/NNN-*/{spec,plan,tasks}.md`, com aprovação do dono nos gates G1 (spec) e G2 (plano/ADR).
3. Teste primeiro, com o ID no título: `test("REQ-XXX-NN: ...")`.
4. Ao final: consolidar `spec.md`/`status.md` da capacidade.

## Comandos
`npm run lint` · `npx tsc --noEmit` · `npm test` (precisa de Postgres e Redis; ver `docs/guides/rodar-e-testar.md`) · `npm run sdd:check` · `node scripts/sdd/impact-map.mjs --worktree`.

## Regras rápidas
- Não invente fatos nem números; marque o que não sabe como ❔ e pergunte.
- Preserve o comportamento atual salvo mudança aprovada em spec.
- Handlers de API chamam `services/`, não `lib/db` direto; decisão de acesso fica no handler (ADR-0017).
- Escreva docs em português. Não edite a Constitution nem ADR Aceito sem pedido explícito do dono.
