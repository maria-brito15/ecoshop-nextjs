#!/usr/bin/env node
// Stop: runs the quick SDD validations and warns if anything is inconsistent (does not block).
import { spawnSync } from "node:child_process";
const falhas = [];
for (const s of ["spec-lint", "trace-check", "adr-index"]) {
  const args = [
    `scripts/sdd/${s}.mjs`,
    ...(s === "adr-index" ? ["--check"] : []),
  ];
  const r = spawnSync("node", args, { encoding: "utf8" });
  if (r.status !== 0) falhas.push(`${s}:\n${(r.stdout + r.stderr).trim()}`);
}
if (falhas.length)
  console.error(
    `Warning: SDD validations have problems.\n${falhas.join("\n")}`,
  );
