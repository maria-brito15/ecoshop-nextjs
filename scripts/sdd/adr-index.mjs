#!/usr/bin/env node
// scripts/sdd/adr-index.mjs — gera docs/architecture/adr/README.md e valida a cadeia de substituições.
// Uso: node scripts/sdd/adr-index.mjs [--check]   (--check: falha se o índice estiver desatualizado)
import { join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import { ADR_DIR, RAIZ, ler, lerAdrs, listar, relatar } from "./lib.mjs";

const STATUS = ["Proposto", "Aceito", "Inferido", "Substituído"];
const adrs = lerAdrs().sort((a, b) => a.id.localeCompare(b.id));
const porId = new Map(adrs.map((a) => [a.id, a]));
const erros = [];

for (const a of adrs) {
  if (!STATUS.includes(a.status))
    erros.push(`${a.id}: status inválido "${a.status}"`);
  if (a.status === "Substituído") {
    const novo = porId.get(a.substituidoPor ?? "");
    if (!novo) erros.push(`${a.id}: "Substituído por" inexistente`);
    else if (novo.substitui !== a.id)
      erros.push(`${novo.id} deveria declarar "Substitui: ${a.id}"`);
  }
  if (a.substitui) {
    const antigo = porId.get(a.substitui);
    if (!antigo) erros.push(`${a.id}: "Substitui" ${a.substitui} inexistente`);
    else if (antigo.status !== "Substituído")
      erros.push(`${antigo.id} deveria estar "Substituído"`);
  }
}

// specs e planos não podem citar ADR substituído como vigente (na linha "ADRs:")
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
        porId.get(id)?.status === "Substituído" &&
        !/substitu|histórico/i.test(l)
      )
        erros.push(
          `${d.replace(RAIZ + "/", "")}: cita ${id} (Substituído) como vigente`,
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
      "docs/architecture/adr/README.md desatualizado: rode `node scripts/sdd/adr-index.mjs`",
    );
} else writeFileSync(alvo, novo);

relatar("adr-index", erros);
