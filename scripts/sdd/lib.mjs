// scripts/sdd/lib.mjs — utilities shared by the SDD validators (plain Node, no dependencies).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const ROOT = process.cwd();
export const CAP_DIR = join(ROOT, "docs/capabilities");
export const ADR_DIR = join(ROOT, "docs/architecture/adr");
export const VALID_STATUSES = ["✅", "◐", "❌", "❔"];
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

export const read = (p) => readFileSync(p, "utf8");
export const config = () => JSON.parse(read(join(ROOT, "sdd.config.json")));

export function listFiles(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    if (statSync(p).isDirectory()) out.push(...listFiles(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

/** Markdown table rows below a "## ..." heading that contains `title` (a string or a list of aliases). */
export function table(md, title) {
  const titles = [title].flat().map((t) => t.toLowerCase());
  const lines = md.split("\n");
  const i = lines.findIndex(
    (l) => /^##\s/.test(l) && titles.some((t) => l.toLowerCase().includes(t)),
  );
  if (i < 0) return null;
  const rows = [];
  for (let j = i + 1; j < lines.length && !/^##\s/.test(lines[j]); j++) {
    const l = lines[j].trim();
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

export const hasSection = (md, name) =>
  [name].flat().some((n) => new RegExp(`^##\\s+${n}`, "mi").test(md));

export function capabilities() {
  const cfg = config();
  return Object.entries(cfg.capabilities).map(([code, c]) => ({
    code,
    folder: c.folder,
    spec: join(CAP_DIR, c.folder, "spec.md"),
    status: join(CAP_DIR, c.folder, "status.md"),
    sourceGlobs: c.code,
  }));
}

export function readAdrs() {
  return listFiles(
    // [\\/]: the application runs on Linux (Docker/CI), but whoever develops may
    // be on Windows, where `listFiles` returns paths with "\" instead of "/".
    ADR_DIR,
    (p) => /[\\/]\d{4}-.*\.md$/.test(p) && !p.includes("0000-template"),
  ).map((p) => {
    const md = read(p);
    const field = (names) =>
      (md.match(new RegExp(`^- (?:${names.join("|")}):\\s*(.+)$`, "m")) ??
        [])[1]?.trim();
    return {
      file: relative(ROOT, p),
      id: "ADR-" + p.match(/(\d{4})-[^\\/]*\.md$/)[1],
      title: (md.match(/^# ADR-\d{4}:\s*(.+)$/m) ?? [])[1],
      status: field(VOCAB.fields.status),
      supersedes: field(VOCAB.fields.supersedes),
      supersededBy: field(VOCAB.fields.supersededBy),
    };
  });
}

export function globToRegex(g) {
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

export function report(title, errors, warnings = []) {
  for (const a of warnings) console.warn(`  warning: ${a}`);
  if (errors.length) {
    console.error(`✖ ${title}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${title}`);
  }
}
