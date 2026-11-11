#!/usr/bin/env node
// scripts/sdd/impact-map.mjs — quais capacidades, REQs e ADRs um diff pode afetar.
// Uso: node scripts/sdd/impact-map.mjs [--base <ref>] [--worktree] [--arquivos a,b] [--exige-adr] [--json]
//  --base        compares <ref>...HEAD (default: HEAD~1)         --worktree  compares the working tree with HEAD
//  --exige-adr   fails if a sensitive path changed and the PR body ($GITHUB_EVENT_PATH or $PR_BODY) does not cite the owning ADR
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  RAIZ,
  ler,
  config,
  capacidades,
  tabela,
  globParaRegex,
} from "./lib.mjs";

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const tem = (n) => process.argv.includes(n);

function arquivosAlterados() {
  if (arg("--arquivos")) return arg("--arquivos").split(",").filter(Boolean);
  try {
    const args = tem("--worktree")
      ? ["diff", "--name-only", "HEAD"]
      : ["diff", "--name-only", `${arg("--base") ?? "HEAD~1"}...HEAD`];
    return execFileSync("git", args, {
      cwd: RAIZ,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function corpoDoPr() {
  if (process.env.PR_BODY) return process.env.PR_BODY;
  const ev = process.env.GITHUB_EVENT_PATH;
  if (ev && existsSync(ev)) {
    try {
      return JSON.parse(ler(ev)).pull_request?.body ?? "";
    } catch {
      /* ignora */
    }
  }
  return "";
}

const arquivos = arquivosAlterados();
const cfg = config();
const afetadas = new Map();
for (const cap of capacidades()) {
  const hit = arquivos.filter((f) =>
    cap.codigoFonte.some((g) => globParaRegex(g).test(f)),
  );
  if (hit.length) afetadas.set(cap.codigo, { cap, arquivos: hit });
}
const sensiveis = [];
for (const s of cfg.sensiveis) {
  const hit = arquivos.filter((f) => globParaRegex(s.caminho).test(f));
  if (hit.length) sensiveis.push({ adr: s.adr, arquivos: hit });
}
const docsMudaram = arquivos.some(
  (f) => f.startsWith("docs/capabilities/") || f.startsWith("specs/"),
);
const testesMudaram = arquivos.some((f) => f.startsWith("tests/"));

if (tem("--json")) {
  console.log(
    JSON.stringify(
      { arquivos, capacidades: [...afetadas.keys()], sensiveis },
      null,
      2,
    ),
  );
} else {
  const L = ["### Mapa de impacto (SDD)", ""];
  if (!arquivos.length) L.push("Nenhum arquivo alterado detectado.");
  else {
    L.push(`Arquivos alterados: ${arquivos.length}`, "");
    if (afetadas.size) {
      L.push("**Capacidades potencialmente afetadas**", "");
      for (const [cod, { cap, arquivos: a }] of afetadas) {
        const reqs = (tabela(ler(cap.spec), "Requisitos") ?? []).map(
          (r) => r[0],
        );
        L.push(
          `- **${cod}** (\`docs/capabilities/${cap.pasta}\`): ${reqs.length} REQs · ${a.length} arquivo(s)`,
        );
      }
      L.push("");
    }
    if (sensiveis.length) {
      L.push("**Caminhos sensíveis (exigem citar o ADR no PR)**", "");
      for (const s of sensiveis) L.push(`- ${s.adr}: ${s.arquivos.join(", ")}`);
      L.push("");
    }
    if (afetadas.size && !docsMudaram)
      L.push(
        '> ⚠ Código de capacidade mudou e nenhuma spec/status foi tocada. Se o comportamento mudou, consolide a spec (G4); senão declare "sem mudança de comportamento" no PR.',
      );
    if (afetadas.size && !testesMudaram) L.push("> ⚠ Nenhum teste alterado.");
  }
  console.log(L.join("\n"));
}

if (tem("--exige-adr") && sensiveis.length) {
  const corpo = corpoDoPr();
  const faltam = sensiveis.filter((s) => !corpo.includes(s.adr));
  if (faltam.length) {
    console.error(
      `✖ impact-map: o PR altera caminho sensível e não cita ${[...new Set(faltam.map((s) => s.adr))].join(", ")} (cite o ADR ou "não altera a decisão do ADR-NNNN")`,
    );
    process.exitCode = 1;
  }
}
