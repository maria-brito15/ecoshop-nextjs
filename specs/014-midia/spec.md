# Change spec: 014-midia

- **Track:** fix with a rule change
- **Affected capabilities:** MIDIA
- **Status:** Implemented on 2026-11-11 (the owner's technical autonomy), **without commits**; consolidated in the living specs
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

Upload validated only the file name's extension; the name check by `readdir` + write had a race.

## Out of scope

Object storage (only if there is more than one instance) and checking whether Next serves, in production, files written after startup ❔.

## Requirements

REQ-MIDIA-06, 07.

## Recorded decision

ADR-0011 (it follows: photos on the filesystem; single instance).

## Verification

`tests/integration/media-content.test.ts` (6 tests, without a database, run).

## Open questions

None blocking.
