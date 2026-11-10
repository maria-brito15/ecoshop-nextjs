# 09 · Governança e prevenção de specification drift

## Princípio

> Drift não se previne com documentação melhor. Previne-se tornando a spec **executável em parte** e tratando o resto como hipótese que um detector confronta com o código. (relatório de pesquisa, cap. 12.3)

No EcoShop isso se traduz em: tudo o que pode virar teste ou script vira; o que é julgamento fica num ponto de revisão humana explícito, com checklist.

## 1. Mecanismos por objetivo

| Objetivo | Mecanismo | Automatizado? | Onde roda |
|---|---|---|---|
| **Identificar mudanças que impactam requisitos** | `impact-map.mjs` lê o diff e, via `sdd.config.json`, lista capacidades e `REQ` relacionados; o template de PR exige declarar "capacidades afetadas" ou "sem mudança de comportamento" | Detecção: sim. Classificação ("muda comportamento?"): humana | CI (resumo do job) + hook local |
| **Identificar mudanças que impactam decisões arquiteturais** | Lista de **caminhos sensíveis** no `sdd.config.json` com o ADR dono: `middleware.ts`, `config/rotas-protegidas.ts` → ADR-0008; `lib/cache/**` → 0009; `lib/redis.ts`, `lib/rate-limit.ts` → 0010; `services/foto.service.ts` → 0011; `lib/ai/**` → 0012; `Dockerfile`, `docker-compose.yml`, `.github/workflows/**` → 0013; `package.json` (dependência nova de runtime), `prisma/schema.prisma` → exige ADR citado | Sim: o CI falha se um caminho sensível mudou e o PR não cita o ADR (ou "não altera a decisão") | CI |
| **Consistência código × testes × specs** | `trace-check.mjs` (REQ↔teste↔status↔ADR) + testes com ID | Sim | CI (bloqueante), hook Stop |
| **Revisar documentação no PR** | Template de PR com checklist; agent `drift-auditor` na capacidade afetada quando o PR muda comportamento | Checklist: humana. Relatório: assistido | PR |
| **Validar critérios de aceite** | Critério decidível → teste com `REQ`. Critério de UI/conteúdo não automatizável → item "verificação manual" no `status.md` com data e quem verificou | Parcial | CI + revisão |
| **Identificar specs obsoletas** | `status.md` tem "última verificação"; `trace-check --stale` lista REQ ✅ cujo teste não roda há N commits ou sumiu, REQ ❔ há mais de 30 dias, spec que cita arquivo inexistente; `drift-auditor` mensal | Detecção sim; decisão humana | CI agendado (cron mensal) que abre issue |
| **Registrar mudança de decisão** | Novo ADR `Substitui: ADR-X`; `adr-index.mjs` valida a cadeia e falha se um ADR substituído ainda é citado como vigente em spec/plan | Sim | CI |

## 2. O que é automático e o que é humano

| Automatizável (CI bloqueia) | Assistido (agente relata, humano decide) | Só humano |
|---|---|---|
| Lint, typecheck, testes, build | Spec de mudança completa? (`spec-reviewer`) | Aprovar spec (G1) e plano/ADR (G2) |
| Formato e IDs de spec (`spec-lint`) | Código cumpre a spec? (`verifier`) | Decidir se uma divergência é bug ou spec velha |
| REQ ✅ sem teste; teste com REQ inexistente | Drift por capacidade (`drift-auditor`) | Validar conteúdo e números exibidos (C-XI) |
| Caminho sensível sem ADR citado | Impacto em capacidades (`impact-map`) | Aceitar risco (ADR com consequência negativa) |
| ADR substituído ainda citado | | Emendar a Constitution |
| Migration nova não versionada / schema duplicado | | |

## 3. Template de PR (`.github/pull_request_template.md`)

```markdown
## Trilha
- [ ] Completa (specs/NNN-…)  - [ ] Correção  - [ ] Correção com mudança de regra  - [ ] Sem comportamento

## Rastreabilidade
- Spec de mudança: specs/NNN-…
- Capacidades afetadas: AUTZ, PERF …   (ou: nenhuma)
- REQs: REQ-PERF-01 (❌→✅), REQ-PERF-04 (novo)
- ADRs: segue ADR-0005; cria ADR-0015 (substitui 0008)

## Verificação
- [ ] Testes com IDs dos REQs passam
- [ ] Spec viva consolidada (docs/capabilities/…/spec.md e status.md)
- [ ] Verificação manual (se houver critério não automatizável): …
- [ ] Nada de dado inventado na UI (C-XI)
```

## 4. Ciclo de vida de um requisito

```
proposto (spec de mudança) → aprovado (G1) → ❌ não implementado → ◐ parcial → ✅ implementado+testado
                                                         ↘ ❔ incerto (precisa verificação)
✅ → obsoleto → retirado (ID nunca reutilizado; motivo e spec de mudança registrados)
```

## 5. Ritmo de governança

| Quando | O quê | Quem |
|---|---|---|
| Todo PR | CI + template + `impact-map` | CI + você |
| PR com mudança de comportamento | `verifier` e `drift-auditor` na capacidade | Claude + você |
| Mensal | `trace-check --stale` + `drift-auditor` em todas as capacidades → issue | Agendado |
| Fim de cada fase do roadmap | Revisar Constitution (princípio não usado sai), skills (não acionada sai), entrada em `docs/learning/` | Você |
