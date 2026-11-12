---
name: brownfield-discovery
description: Use to understand existing code that has no spec: survey the real behavior, separate fact from inference and turn it into a living spec with an honest status.
---

# Discovery in existing code

1. Walk the map in `sdd.config.json`: routes, services, schema, tests, docs.
2. For each capability, list behaviors with `file:line`. Run the code or a test when you can; without execution, it is inference.
3. Compare with the README and docs: a divergence becomes a "❌ or ❔" item in the spec, not a silent adjustment.
4. Write REQs describing the desired behavior, with the status given by what the code does today.
5. Defects: characterize them with a `todo` test before fixing.
6. Business doubts go to "Open questions"; do not invent intent.
7. Record the dated snapshot in `docs/discovery/YYYY-MM-<name>/` (frozen) and point to the living spec as the current truth.
