#!/usr/bin/env node
// scripts/sdd/adr-index.mjs — generates docs/architecture/adr/README.md and validates the supersession chain.
// Usage: node scripts/sdd/adr-index.mjs [--check]   (--check: fails if the index is out of date)
import { join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import {
  ADR_DIR,
  RAIZ,
  ler,
  lerAdrs,
  listar,
  relatar,
  statusKey,
} from "./lib.mjs";

const adrs = lerAdrs().sort((a, b) => a.id.localeCompare(b.id));
const porId = new Map(adrs.map((a) => [a.id, a]));
const erros = [];

for (const a of adrs) {
  if (!statusKey(a.status)) erros.push(`${a.id}: invalid status "${a.status}"`);
  if (statusKey(a.status) === "superseded") {
    const novo = porId.get(a.substituidoPor ?? "");
    if (!novo) erros.push(`${a.id}: "Superseded by" target does not exist`);
    else if (novo.substitui !== a.id)
      erros.push(`${novo.id} should declare "Supersedes: ${a.id}"`);
  }
  if (a.substitui) {
    const antigo = porId.get(a.substitui);
    if (!antigo)
      erros.push(`${a.id}: "Supersedes" ${a.substitui} does not exist`);
    else if (statusKey(antigo.status) !== "superseded")
      erros.push(`${antigo.id} should be "Superseded"`);
  }
}

// specs and plans must not cite a superseded ADR as current (on the "ADRs:" line)
const docs = [
  ...listar(join(RAIZ, "docs/capabilities"), (p) => p.endsWith("spec.md")),
  ...listar(
    join(RAIZ, "specs"),
    (p) => p.endsWith("plan.md") || p.endsWith("spec.md"),
  ),
];
for (const d of docs) {
  for (const l of ler(d)
    .split("\n")
    .filter((x) => /ADRs?[^:]*:/i.test(x) && /ADR-\d{4}/.test(x))) {
    for (const id of l.match(/ADR-\d{4}/g)) {
      if (
        statusKey(porId.get(id)?.status) === "superseded" &&
        !/substitu|supersed|hist[oó]ric|history/i.test(l)
      )
        erros.push(
          `${d.replace(RAIZ + "/", "")}: cites ${id} (Superseded) as current`,
        );
    }
  }
}

const linhas = [
  "# Registro de decisões arquiteturais (ADRs)",
  "",
  "> Gerado por `node scripts/sdd/adr-index.mjs`. Não edite à mão. Modelo: [0000-template.md](0000-template.md). Pendentes: [pendentes.md](pendentes.md).",
  "> **Inferido** = descrição do que o código mostra; não prova que houve decisão formal. ADR aceito é imutável: mudou de ideia, crie um novo que o substitui.",
  "",
  "| ADR | Decisão | Status | Relação |",
  "|---|---|---|---|",
  ...adrs.map(
    (a) =>
      `| [${a.id}](${a.arquivo.split("/").pop()}) | ${a.titulo} | ${a.status} | ${a.substituidoPor ? "substituído por " + a.substituidoPor : a.substitui ? "substitui " + a.substitui : ""} |`,
  ),
  "",
];
const novo = linhas.join("\n");
const alvo = join(ADR_DIR, "README.md");
if (process.argv.includes("--check")) {
  if (!existsSync(alvo) || ler(alvo) !== novo)
    erros.push(
      "docs/architecture/adr/README.md is out of date: run `node scripts/sdd/adr-index.mjs`",
    );
} else writeFileSync(alvo, novo);

relatar("adr-index", erros);
