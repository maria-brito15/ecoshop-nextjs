# Plan: 007-history-and-real-metrics

- **Spec:** ./spec.md
- **ADRs it follows:** ADR-0004 (client-side UI), ADR-0011 (precedent of "no backend when not needed") · **New ADRs / ones it supersedes:** none

## Technical approach

1. `app/(store)/produtos/[id]/page.tsx`: a new `useEffect` (depends on `data?.produto`) that reads `ecoshop_history`, removes any old entry of the same product (avoids a duplicate on revisit), inserts the new one at the top, cuts to 50 items, and writes it back. All inside `try/catch` — the history is not critical, it must not break the page if `localStorage` fails.
2. `app/(perfil)/perfil/page.tsx`: replaces `historyCount` (just a number) with `historico: HistoryItem[]` (the complete list); the "History" tab now renders that list (link to the product, photo, name, price, visit date) instead of always showing the empty state; the empty state only appears when `historico.length === 0`.
3. `ImpactCard` gains a required prop `fonte: string`, rendered as a caption below the value — no metric is left without a declared source (Art. XI). "Explorador Verde" declares that it is a real count; the other two declare the invented formula as an illustrative estimate.

Discarded alternative: a `HistoricoVisualizacao` table in Postgres, linked to `usuarioId`. Rejected in this change because (a) the code already presupposed `localStorage` before this fix — moving to the database would change the architecture, not only fix the defect; (b) it would require an owner decision on how long to retain this data and whether anonymous users (without an account) also see a history, which this change was not asked to decide.

## Constitution Check

| Article | Applies? | Met? | Note |
|---|---|---|---|
| II Tests per REQ | yes | partial | no component suite in the project (ADR-0016 only covers the API); the dedup/order/limit logic verified by simulation in Node (not an automated test in the repo) |
| V Layers | yes | yes | no call to `lib/db`; it is only `localStorage` on the client |
| XI No invented data | yes | yes | the two metrics with an invented factor now declare the formula and that it is an estimate |

## Affected files

| File | Change | REQ |
|---|---|---|
| `app/(store)/produtos/[id]/page.tsx` | writes `ecoshop_history` when visiting a product | REQ-PERF-05 |
| `app/(perfil)/perfil/page.tsx` | reads and renders the real list; `ImpactCard` gains `fonte` | REQ-PERF-05, REQ-PERF-06 |
| `docs/capabilities/account-and-profile/{spec,status}.md` | REQ-PERF-05/06 ❌→◐ | REQ-PERF-05, REQ-PERF-06 |
| `docs/architecture/adr/pending.md` | removes the backlog row | — |

## Verification plan

No integration test (it is not an API) nor a component suite in the project. Verification done by simulation in Node of the write function (dedup, most-recent-first order, cut at 50) — all three properties confirmed. Manual pending: open two different products, see both in the History tab; revisit one, confirm it does not duplicate; open the Impact tab and confirm the source captions — not done in this session for lack of a browser.

## Risks and rollback

Risk: a user with a full or blocked `localStorage` has no history — it degrades to the current empty state, without error. Rollback: remove the write `useEffect` and return `ImpactCard`/the History tab to the previous state (the read already tolerates the missing key).

## Complexity Tracking

No violations.
