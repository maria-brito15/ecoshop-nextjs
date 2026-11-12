# SCAN · Implementation status

Legend: ✅ implemented and tested · ◐ partial or untested · ❌ not implemented or defective · ❔ uncertain, needs verification. Evidence: `test: <file>` or `manual: YYYY-MM-DD <what>` or `code: <where>`.

## Status

| REQ | Status | Evidence | Verified on |
|---|---|---|---|
| REQ-SCAN-01 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-02 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-03 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-04 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-05 | ✅ | test: tests/integration/input-and-errors.test.ts (`analyzeImage` with Gemini throwing → fallback, run without a database); the route test in ecoscan.test.ts lost its `todo` and **was not run** (needs a database). Fixed in 009: `generateText` catches the failure | 2026-11-11 |
| REQ-SCAN-06 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-07 | ✅ | test: tests/integration/ecoscan.test.ts | 2026-11-10 |
| REQ-SCAN-08 | ◐ | code: app/(ai-scan); no UI test | 2026-11-10 |
| REQ-SCAN-09 | ✅ | test: tests/integration/input-and-errors.test.ts (`fetchWithTimeout` and the two providers with a short injected timeout). Default timeouts (Azure 10 s, Gemini 20 s) are initial values **without measurement** | 2026-11-11 |
