# Non-functional requirements (NFR)

They cut across the capabilities. Capability specs **reference** these IDs, they do not repeat them. Status: ✅ met and tested · ◐ partial/untested · ❌ not met · ❔ not verified.

| ID | Requirement | Verification | Status |
|---|---|---|---|
| NFR-SEG-01 | Password hashes, tokens and API keys never leave the server (responses, logs, URLs) | Contract tests; review | ◐ (user response ✅; Gemini key still goes in the query string) |
| NFR-SEG-02 | Login attempts limited per IP (10/min) and sign-up (5/h) | Test with Redis | ◐ |
| NFR-SEG-03 | Session cookie httpOnly, `secure` in production, `sameSite=lax` | Header test | ◐ |
| NFR-SEG-04 | Routes without a declared policy are denied by default | Matrix test | ❌ |
| NFR-DISP-01 | Without Redis, reads work straight from the database | Test with Redis simulated as failing | ◐ |
| NFR-DISP-02 | An Azure/Gemini failure or slowness never takes the request down with 500 when there is specified behavior | Adapter tests | ❌ (D4) |
| NFR-DISP-03 | Every external network call has a timeout | Review/test | ❌ |
| NFR-CONS-01 | A mutation of an entity invalidates the caches that embed it | "Mutation → read" tests | ❌ (brand → products) |
| NFR-DES-01 | Listings limit the page size (≤ 100) | Test | ❌ (D9) |
| NFR-OPS-01 | Seeds never delete data in a shared environment and are idempotent | Review/test | ❌ (D5) |
| NFR-OPS-02 | A new environment comes up with a usable administrator | Manual test/CI | ❌ (D6) |
| NFR-OPS-03 | `/api/health` distinguishes a required dependency (database) from an optional one (Redis) | Test | ❌ |
| NFR-A11Y-01 | Contrast and keyboard navigation on the main screens | — | ❔ (not verified) |
| NFR-PRIV-01 | AI-generated content is identified as such in the interface | Review | ❔ |
