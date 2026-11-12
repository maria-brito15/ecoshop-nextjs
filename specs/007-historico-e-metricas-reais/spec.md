# Change spec: 007-historico-e-metricas-reais

- **Track:** fix (REQ-PERF-05/06 already existed in the spec; the code read a key that it never wrote)
- **Affected capabilities:** PERF (`docs/capabilities/conta-e-perfil`)
- **Status:** Consolidated
- **Author / approver:** Claude / Arthur (feature chosen from the backlog on 2026-11-11) · **Date:** 2026-11-11

## Problem

`app/(perfil)/perfil/page.tsx` already read the `localStorage.ecoshop_history` key to count visited products, but nothing in the whole code wrote it — `historyCount` was always `0`, the "History" tab always showed the empty state, and the "Impact" metrics (derived from `historyCount`) were always zero, with no indication that the conversion factors (50L, 0.3) were invented estimates.

## Out of scope

- Per-account history (server/Postgres), synchronized between devices. The history is per browser (see "Decision" below).
- Any real scientific source of environmental impact (it does not exist in the project; the same decision already taken for REQ-CONT-02/05).
- REQ-CONT-02 and REQ-CONT-05: they were already ✅/◐ through labeling (resolved on 2026-11-10, commit `35a75a6`); the backlog row that cited them together with REQ-PERF-05/06 was outdated — no additional change to them here.

## Decision (no ADR: it follows the pattern already implicit in the code)

The history stays in `localStorage`, not in a new table. The code already read from that key before this change (it only lacked writing); creating a history table in Postgres would be an unrequested scope extension, and the "no backend when not needed" pattern already appears in ADR-0004/ADR-0011. If the owner wants a per-account history (synchronized between devices) in the future, that is a new architecture decision, not this fix.

## Current behavior (fact, with evidence)

- `app/(perfil)/perfil/page.tsx:464-472` (before): read `ecoshop_history`, but no file wrote that key.
- `app/(store)/produtos/[id]/page.tsx`: had no history-writing effect.
- The three "Impact" metrics (`ImpactCard`) had no source caption.
- `docs/capabilities/conta-e-perfil/status.md`: REQ-PERF-05/06 ❌.

## Requirements

| ID | Requirement (EARS) | Acceptance criterion | New / Changes |
|---|---|---|---|
| REQ-PERF-05 | When the user visits a product, the system shall record it in the history and show it in the History tab of the profile. | Visiting 2 distinct products → the History tab shows the 2, most recent first; revisiting a product does not duplicate the entry | Already existed (❌→◐, see the verification note) |
| REQ-PERF-06 | When the user opens the Impact tab, the system shall show metrics derived from the user's own real data. | "Explorador Verde" is the real count of the history; the other two metrics (invented conversion factors) stay labeled as an illustrative estimate, with the formula declared | Already existed (❌→◐, see the verification note) |

## Scenarios and edge cases

- `localStorage` unavailable (private mode/browser blocking): the write fails silently (try/catch); the read also falls back to an empty list — the page does not break.
- History with more than 50 items: keeps only the 50 most recent (an arbitrary limit so it does not grow forever; documented in the code).
- A product without `fotoUrl`: the history item shows the 🌱 icon, like the rest of the site.

## Business rules and constraints

- Constitution Art. XI: the two metrics with an invented factor (50L, 0.3) have the source declared on the screen itself, the same pattern as REQ-CONT-02/05.

## Affected interfaces

`app/(store)/produtos/[id]/page.tsx` (writes `ecoshop_history`) · `app/(perfil)/perfil/page.tsx` (reads and renders the list; labels the metrics).

## Delta in the living spec

`conta-e-perfil/status.md`: REQ-PERF-05/06 ❌→◐ (code; manual check in the browser missing — the history logic was verified by simulation in Node, not through the real UI). `conta-e-perfil/spec.md`: resolves the first open question. `pendentes.md`: removes the backlog row.

## Open questions

Open question #2 of the living spec ("can the user change their own email and password?") stays unanswered, unrelated to this change.
