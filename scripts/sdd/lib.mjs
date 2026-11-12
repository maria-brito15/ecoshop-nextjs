// scripts/sdd/lib.mjs — utilities shared by the SDD validators (plain Node, no dependencies).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const RAIZ = process.cwd();
export const CAP_DIR = join(RAIZ, "docs/capabilities");
export const ADR_DIR = join(RAIZ, "docs/architecture/adr");
export const STATUS_VALIDOS = ["✅", "◐", "❌", "❔"];
export const REQ_RE = /REQ-[A-Z]+-\d{2}/g;

// Vocabulary read from the markdown (headings, ADR statuses and metadata keys).
// Each concept is a list so that aliases can be added without touching the checkers.
export const VOCAB = {
  sections: {
    goal: ["Goal"],
    actors: ["Actors"],
    rules: ["Business rules"],
    requirements: ["Requirements"],
    edgeCases: ["Edge cases"],
    interfaces: ["Interfaces"],
    nfrs: ["Applicable NFRs"],
    outOfScope: ["Out of scope"],
    openQuestions: ["Open questions"],
  },
  status: {
    proposed: ["Proposed"],
    accepted: ["Accepted"],
    inferred: ["Inferred"],
    superseded: ["Superseded"],
  },
  fields: {
    status: ["Status"],
    supersedes: ["Supersedes"],
    supersededBy: ["Superseded by"],
  },
};

/** Maps a raw ADR status word to its canonical key, or undefined. */
export const statusKey = (word) =>
  Object.entries(VOCAB.status).find(([, v]) => v.includes(word))?.[0];

export const ler = (p) => readFileSync(p, "utf8");
export const config = () => JSON.parse(ler(join(RAIZ, "sdd.config.json")));

export function listar(dir, filtro = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (nome === "node_modules" || nome === ".next") continue;
    if (statSync(p).isDirectory()) out.push(...listar(p, filtro));
    else if (filtro(p)) out.push(p);
  }
  return out;
}

/** Markdown table rows below a "## ..." heading that contains `titulo` (a string or a list of aliases). */
export function tabela(md, titulo) {
  const titulos = [titulo].flat().map((t) => t.toLowerCase());
  const linhas = md.split("\n");
  const i = linhas.findIndex(
    (l) => /^##\s/.test(l) && titulos.some((t) => l.toLowerCase().includes(t)),
  );
  if (i < 0) return null;
  const rows = [];
  for (let j = i + 1; j < linhas.length && !/^##\s/.test(linhas[j]); j++) {
    const l = linhas[j].trim();
    if (!l.startsWith("|") || /^\|[\s:|-]+\|$/.test(l)) continue;
    rows.push(
      l
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    );
  }
  return rows.slice(1); // drops the header
}

export const temSecao = (md, nome) =>
  [nome].flat().some((n) => new RegExp(`^##\\s+${n}`, "mi").test(md));

export function capacidades() {
  const cfg = config();
  return Object.entries(cfg.capacidades).map(([codigo, c]) => ({
    codigo,
    pasta: c.pasta,
    spec: join(CAP_DIR, c.pasta, "spec.md"),
    status: join(CAP_DIR, c.pasta, "status.md"),
    codigoFonte: c.codigo,
  }));
}

export function lerAdrs() {
  return listar(
    // [\\/]: the application runs on Linux (Docker/CI), but whoever develops may
    // be on Windows, where `listar` returns paths with "\" instead of "/".
    ADR_DIR,
    (p) => /[\\/]\d{4}-.*\.md$/.test(p) && !p.includes("0000-template"),
  ).map((p) => {
    const md = ler(p);
    const campo = (nomes) =>
      (md.match(new RegExp(`^- (?:${nomes.join("|")}):\\s*(.+)$`, "m")) ??
        [])[1]?.trim();
    return {
      arquivo: relative(RAIZ, p),
      id: "ADR-" + p.match(/(\d{4})-[^\\/]*\.md$/)[1],
      titulo: (md.match(/^# ADR-\d{4}:\s*(.+)$/m) ?? [])[1],
      status: campo(VOCAB.fields.status),
      substitui: campo(VOCAB.fields.supersedes),
      substituidoPor: campo(VOCAB.fields.supersededBy),
    };
  });
}

export function globParaRegex(g) {
  const esc = g
    .replace(/[.+^${}()|\\]/g, "\\$&")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
  return new RegExp(
    "^" +
      esc.replace(/\*\*/g, "§§").replace(/\*/g, "[^/]*").replace(/§§/g, ".*") +
      "$",
  );
}

export function relatar(titulo, erros, avisos = []) {
  for (const a of avisos) console.warn(`  warning: ${a}`);
  if (erros.length) {
    console.error(`✖ ${titulo}: ${erros.length} problem(s)`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${titulo}`);
  }
}
