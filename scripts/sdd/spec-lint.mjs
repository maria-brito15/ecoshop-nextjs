#!/usr/bin/env node
// scripts/sdd/spec-lint.mjs — format of capability specs and change specs.
// Checks: required sections, unique IDs with the capability prefix, EARS requirements,
// cited ADRs exist, spec.md and status.md are consistent, specs/NNN are complete.
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  RAIZ,
  ler,
  tabela,
  temSecao,
  capacidades,
  lerAdrs,
  listar,
  STATUS_VALIDOS,
  relatar,
  VOCAB,
} from "./lib.mjs";

const erros = [];
const adrs = new Set(lerAdrs().map((a) => a.id));
const vistos = new Map();
const SECOES = Object.values(VOCAB.sections);

for (const cap of capacidades()) {
  const onde = `docs/capabilities/${cap.pasta}`;
  if (!existsSync(cap.spec)) {
    erros.push(`${onde}/spec.md does not exist`);
    continue;
  }
  if (!existsSync(cap.status)) {
    erros.push(`${onde}/status.md does not exist`);
    continue;
  }
  const spec = ler(cap.spec);
  const status = ler(cap.status);
  for (const s of SECOES)
    if (!temSecao(spec, s))
      erros.push(`${onde}/spec.md: missing section "## ${s[0]}"`);

  const reqs = tabela(spec, VOCAB.sections.requirements) ?? [];
  const ids = [];
  for (const [id, enunciado] of reqs) {
    if (!new RegExp(`^REQ-${cap.codigo}-\\d{2}$`).test(id)) {
      erros.push(`${onde}: ID "${id}" does not match REQ-${cap.codigo}-NN`);
      continue;
    }
    if (vistos.has(id))
      erros.push(`${id} duplicated (${vistos.get(id)} and ${onde})`);
    vistos.set(id, onde);
    ids.push(id);
    if (!/\bshall\b/i.test(enunciado ?? ""))
      erros.push(
        `${id}: the statement is not in EARS form ("... the system shall ...")`,
      );
  }
  if (!ids.length) erros.push(`${onde}/spec.md: no requirement found`);

  const linhas = tabela(status, "Status") ?? [];
  const noStatus = new Set();
  for (const [id, st] of linhas) {
    noStatus.add(id);
    if (!ids.includes(id))
      erros.push(`${onde}/status.md: ${id} does not exist in the spec`);
    if (!STATUS_VALIDOS.includes(st))
      erros.push(`${onde}/status.md: ${id} has an invalid status "${st}"`);
  }
  for (const id of ids)
    if (!noStatus.has(id))
      erros.push(`${onde}/status.md: missing row for ${id}`);

  for (const m of spec.matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      erros.push(`${onde}/spec.md cites ${m[0]}, which does not exist`);
}

// change specs (Spec Kit)
for (const spec of listar(
  join(RAIZ, "specs"),
  (p) => basename(p) === "spec.md",
)) {
  const pasta = spec.slice(0, -"/spec.md".length);
  // basename() handles both "/" and "\" (Windows); pasta.lastIndexOf("/")
  // alone found nothing on Windows paths and returned the whole path.
  const nome = basename(pasta);
  if (!/^\d{3}-/.test(nome))
    erros.push(`specs/${nome}: the name must start with NNN-`);
  for (const f of ["plan.md", "tasks.md"])
    if (!existsSync(join(pasta, f))) erros.push(`specs/${nome}: missing ${f}`);
  for (const m of ler(spec).matchAll(/ADR-\d{4}/g))
    if (!adrs.has(m[0]))
      erros.push(`specs/${nome}/spec.md cites ${m[0]}, which does not exist`);
}

relatar("spec-lint", erros);
