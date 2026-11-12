---
name: technical-writing
description: Use to produce clear, consistent technical documentation in English: READMEs, ADRs, specs, guides and changelogs, with the project's structure and terms.
---

# Technical writing (EcoShop)

- English, short sentences, active voice. Glossary terms in `docs/product/glossary.md`.
- First what the reader must do or know; then why.
- Every claim about the system points to evidence (`file:line`, test or ADR) or is marked as inference/doubt.
- Do not duplicate: point to the source of truth (Constitution, living spec, ADR).
- Lean README: what it is, how to run it, where the documentation is. Detail goes in `docs/`.
- Guides (`docs/guides/`): numbered steps, copyable commands, expected result.
- Mark `[FACT]`, `[INFERENCE]`, `[RECOMMENDATION]`, `[DOUBT]` in analysis documents.
