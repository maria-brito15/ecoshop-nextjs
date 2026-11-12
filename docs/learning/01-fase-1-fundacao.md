# Phase 1 · Foundation

**What was done:** Constitution (16 articles), ADRs (0001–0017), product and architecture documents, PR template, ESLint 9 + Prettier, rewritten CI.

**Concepts**
- *Constitution*: a few stable rules that apply to every change. It solves the problem of each decision starting from scratch. It lives in `.specify/memory/`; the specs do not repeat it, they point to it.
- *ADR*: a record of a decision with alternatives. It solves "why is it like this?" months later. ADRs 0003–0014 are *inferred* from the code: they say what the code already does, not what someone consciously decided — which is why there is a confidence column.
- *Two layers of spec* (ADR-0001): living spec (how the system is today) and change spec (how it will change). Without the living one, nobody knows the current truth; without the change one, there is no record of why.

**EcoShop lesson:** CI never passed because Next's interactive lint asked for configuration. A gate that never runs protects nothing. Fixing this was a prerequisite for any governance.

**Tool:** Spec Kit could not be installed in this environment; `.specify/` was written by hand (ADR-0002). When possible, run `specify init` and reconcile.
