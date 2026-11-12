#!/usr/bin/env node
// scripts/sdd/spec-lint.mjs — format of capability specs and change specs.
// Checks: required sections, unique IDs with the capability prefix, EARS requirements,
// cited ADRs exist, spec.md and status.md are consistent, specs/NNN are complete.
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  ROOT,
  read,
  table,
  hasSection,
  capabilities,
  readAdrs,
  listFiles,
  VALID_STATUSES,
  report,
  VOCAB,
} from "./lib.mjs";

const errors = [];
const adrs = new Set(readAdrs().map((a) => a.id));
const seen = new Map();
const SECTIONS = Object.values(VOCAB.sections);

for (const cap of capabilities()) {
  const where = `docs/capabilities/${cap.folder}`;
  if (!existsSync(cap.spec)) {
    errors.push(`${where}/spec.md does not exist`);
    continue;
  }
  if (!existsSync(cap.status)) {
    errors.push(`${where}/status.md does not exist`);
    continue;
  }
  const spec = read(cap.spec);
  const status = read(cap.status);
  for (const s of SECTIONS)
    if (!hasSection(spec, s))
      errors.push(`${where}/spec.md: missing section "## ${s[0]}"`);

  const reqs = table(spec, VOCAB.sections.requirements) ?? [];
  const ids = [];
  for (const [id, statement] of reqs) {
    if (!new RegExp(`^REQ-${cap.code}-\\d{2}$`).test(id)) {
      errors.push(`${where}: ID "${id}" does not match REQ-${cap.code}-NN`);
      continue;
    }
    if (seen.has(id))
      errors.push(`${id} duplicated (${seen.get(id)} and ${where})`);
    seen.set(id, where);
    ids.push(id);
    if (!/\bshall\b/i.test(statement ?? ""))
      errors.push(
        `${id}: the statement is not in EARS form ("... the system shall ...")`,
      );
  }
  if (!ids.length) errors.push(`${where}/spec.md: no requirement found`);

  const lines = table(status, "Status") ?? [];
  const inStatus = new Set();
  for (const [id, st] of lines) {
    inStatus.add(id);
    if (!ids.includes(id))
      errors.push(`${where}/status.md: ${id} does not exist in the spec`);
    if (!VALID_STATUSES.includes(st))
      errors.push(`${where}/status.md: ${id} has an invalid status "${st}"`);
  }
  for (const id of ids)
    if (!inStatus.has(id))
      errors.push(`${where}/status.md: missing row for ${id}`);

  for (const m of spec.matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      errors.push(`${where}/spec.md cites ${m[0]}, which does not exist`);
}

// change specs (Spec Kit)
for (const spec of listFiles(
  join(ROOT, "specs"),
  (p) => basename(p) === "spec.md",
)) {
  const folder = spec.slice(0, -"/spec.md".length);
  // basename() handles both "/" and "\" (Windows); folder.lastIndexOf("/")
  // alone found nothing on Windows paths and returned the whole path.
  const name = basename(folder);
  if (!/^\d{3}-/.test(name))
    errors.push(`specs/${name}: the name must start with NNN-`);
  for (const f of ["plan.md", "tasks.md"])
    if (!existsSync(join(folder, f))) errors.push(`specs/${name}: missing ${f}`);
  for (const m of read(spec).matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      errors.push(`specs/${name}/spec.md cites ${m[0]}, which does not exist`);
}

report("spec-lint", errors);
