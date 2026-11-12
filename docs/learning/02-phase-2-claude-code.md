# Phase 2 · Claude Code (skills, rules, agents, hooks)

**Pieces and the problem each one solves**
- `CLAUDE.md`: short context that points to the sources of truth (it does not duplicate the Constitution).
- *Skills*: procedures that Claude loads when the task calls for them (requirements, ADR, SDD flow, writing, tests, discovery).
- *Rules* (`.claude/rules`): per-path rules; they only show up when those files are touched.
- Read-only *agents*: `spec-reviewer` (a fresh look at the spec), `verifier` (checks code × spec), `drift-auditor` (sweeps for divergences). They do not edit; the owner decides.
- *Hooks*: deterministic automations. Here they only protect (ask for confirmation when editing the Constitution/an accepted ADR or running a destructive command) and remind (the impact of the edit; validations on stop). They do not block legitimate work.

**Principle:** an instruction in text is a request; a hook and CI are a guarantee. The only coercive gate is CI.
