// scripts/sdd/lib.mjs — utilitários compartilhados pelos validadores de SDD (Node puro, sem dependências).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const RAIZ = process.cwd();
export const CAP_DIR = join(RAIZ, "docs/capabilities");
export const ADR_DIR = join(RAIZ, "docs/architecture/adr");
export const STATUS_VALIDOS = ["✅", "◐", "❌", "❔"];
export const REQ_RE = /REQ-[A-Z]+-\d{2}/g;

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

/** Linhas de tabela markdown abaixo de um cabeçalho "## ..." que contém `titulo`. */
export function tabela(md, titulo) {
  const linhas = md.split("\n");
  const i = linhas.findIndex(
    (l) => /^##\s/.test(l) && l.toLowerCase().includes(titulo.toLowerCase()),
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
  return rows.slice(1); // descarta o cabeçalho
}

export const temSecao = (md, nome) =>
  new RegExp(`^##\\s+${nome}`, "mi").test(md);

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
    // [\\/]: a aplicação roda em Linux (Docker/CI), mas quem desenvolve pode
    // estar no Windows, onde `listar` devolve caminhos com "\" em vez de "/".
    ADR_DIR,
    (p) => /[\\/]\d{4}-.*\.md$/.test(p) && !p.includes("0000-template"),
  ).map((p) => {
    const md = ler(p);
    const campo = (nome) =>
      (md.match(new RegExp(`^- ${nome}:\\s*(.+)$`, "m")) ?? [])[1]?.trim();
    return {
      arquivo: relative(RAIZ, p),
      id: "ADR-" + p.match(/(\d{4})-[^\\/]*\.md$/)[1],
      titulo: (md.match(/^# ADR-\d{4}:\s*(.+)$/m) ?? [])[1],
      status: campo("Status"),
      substitui: campo("Substitui"),
      substituidoPor: campo("Substituído por"),
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
  for (const a of avisos) console.warn(`  aviso: ${a}`);
  if (erros.length) {
    console.error(`✖ ${titulo}: ${erros.length} problema(s)`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${titulo}`);
  }
}
