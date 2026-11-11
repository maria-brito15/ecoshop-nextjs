#!/usr/bin/env node
// Stop: roda as validações rápidas de SDD e avisa se algo ficou inconsistente (não bloqueia).
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
    `Atenção: validações de SDD com problemas.\n${falhas.join("\n")}`,
  );
