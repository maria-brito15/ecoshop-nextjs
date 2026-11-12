# Change spec: 015-config-e-log

- **Track:** full (short)
- **Affected capabilities:** OPS
- **Status:** Implemented on 2026-11-11 (the owner's technical autonomy), **without commits**; consolidated in the living specs
- **Author / approver:** Claude / project owner · **Date:** 2026-11-11

## Problem

`DATABASE_URL` only failed on the first query; `ERRORS.internal` and Redis left no structured trace.

## Out of scope

A single schema for ALL variables (only the production-required ones were covered); tracing/APM (Art. XIII).

## Requirements

REQ-OPS-18, 19.

## Recorded decision

None (Constitution Art. XII.2 and XIII.1).

## Verification

`tests/integration/log.test.ts` and `operations-delivery.test.ts` (run, without a database).

## Open questions

None blocking.
