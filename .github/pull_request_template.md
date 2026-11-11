## Trilha
- [ ] Completa (`specs/NNN-…`)  - [ ] Correção  - [ ] Correção com mudança de regra  - [ ] Sem mudança de comportamento

## Rastreabilidade
- Spec de mudança: `specs/NNN-…` (ou n/a)
- Capacidades afetadas: (ex.: AUTZ, PERF) ou "nenhuma"
- REQs: (ex.: REQ-PERF-01 ❌→✅)
- ADRs: segue ADR-… / cria ADR-… / "não altera a decisão do ADR-…" (obrigatório se mexeu em caminho sensível; veja `sdd.config.json`)

## Verificação
- [ ] Testes com os IDs dos REQs passam
- [ ] Spec viva consolidada (`docs/capabilities/…/spec.md` e `status.md`)
- [ ] Verificação manual (se houver critério não automatizável): …
- [ ] Nenhum dado inventado na interface (Constitution, Art. XI)
- [ ] Se há migration: ela é compatível com a versão anterior da aplicação (adiciona antes de remover), porque a reversão do deploy não desfaz migrations (`scripts/deploy/deploy.sh`)
