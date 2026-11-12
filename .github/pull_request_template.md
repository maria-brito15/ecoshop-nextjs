## Track
- [ ] Full (`specs/NNN-…`)  - [ ] Fix  - [ ] Fix with a rule change  - [ ] No behavior change

## Traceability
- Change spec: `specs/NNN-…` (or n/a)
- Affected capabilities: (e.g. AUTZ, PERF) or "none"
- REQs: (e.g. REQ-PERF-01 ❌→✅)
- ADRs: follows ADR-… / creates ADR-… / "does not change the decision of ADR-…" (required if a sensitive path changed; see `sdd.config.json`)

## Verification
- [ ] Tests with the REQ IDs pass
- [ ] Living spec consolidated (`docs/capabilities/…/spec.md` and `status.md`)
- [ ] Manual verification (if a criterion cannot be automated): …
- [ ] No invented data in the interface (Constitution, Art. XI)
- [ ] If there is a migration: it is compatible with the previous application version (add before removing), because rolling back the deploy does not undo migrations (`scripts/deploy/deploy.sh`)
