#!/usr/bin/env node
// scripts/sdd/impact-map.mjs — which capabilities, REQs and ADRs a diff may affect.
// Usage: node scripts/sdd/impact-map.mjs [--base <ref>] [--worktree] [--files a,b] [--require-adr] [--json]
//  --base        compares <ref>...HEAD (default: HEAD~1)         --worktree  compares the working tree with HEAD
//  --require-adr fails if a sensitive path changed and the PR body ($GITHUB_EVENT_PATH or $PR_BODY) does not cite the owning ADR
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  ROOT,
  read,
  config,
  capabilities,
  table,
  globToRegex,
  VOCAB,
} from "./lib.mjs";

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const has = (n) => process.argv.includes(n);

function changedFiles() {
  if (arg("--files")) return arg("--files").split(",").filter(Boolean);
  try {
    const args = has("--worktree")
      ? ["diff", "--name-only", "HEAD"]
      : ["diff", "--name-only", `${arg("--base") ?? "HEAD~1"}...HEAD`];
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function prBody() {
  if (process.env.PR_BODY) return process.env.PR_BODY;
  const ev = process.env.GITHUB_EVENT_PATH;
  if (ev && existsSync(ev)) {
    try {
      return JSON.parse(read(ev)).pull_request?.body ?? "";
    } catch {
      /* ignored */
    }
  }
  return "";
}

const files = changedFiles();
const cfg = config();
const affected = new Map();
for (const cap of capabilities()) {
  const hit = files.filter((f) =>
    cap.sourceGlobs.some((g) => globToRegex(g).test(f)),
  );
  if (hit.length) affected.set(cap.code, { cap, files: hit });
}
const sensitive = [];
for (const s of cfg.sensitivePaths) {
  const hit = files.filter((f) => globToRegex(s.path).test(f));
  if (hit.length) sensitive.push({ adr: s.adr, files: hit });
}
const docsChanged = files.some(
  (f) => f.startsWith("docs/capabilities/") || f.startsWith("specs/"),
);
const testsChanged = files.some((f) => f.startsWith("tests/"));

if (has("--json")) {
  console.log(
    JSON.stringify(
      { files, capabilities: [...affected.keys()], sensitive },
      null,
      2,
    ),
  );
} else {
  const L = ["### Impact map (SDD)", ""];
  if (!files.length) L.push("No changed files detected.");
  else {
    L.push(`Changed files: ${files.length}`, "");
    if (affected.size) {
      L.push("**Potentially affected capabilities**", "");
      for (const [cod, { cap, files: a }] of affected) {
        const reqs = (table(read(cap.spec), VOCAB.sections.requirements) ?? []).map(
          (r) => r[0],
        );
        L.push(
          `- **${cod}** (\`docs/capabilities/${cap.folder}\`): ${reqs.length} REQs · ${a.length} file(s)`,
        );
      }
      L.push("");
    }
    if (sensitive.length) {
      L.push("**Sensitive paths (the PR must cite the ADR)**", "");
      for (const s of sensitive) L.push(`- ${s.adr}: ${s.files.join(", ")}`);
      L.push("");
    }
    if (affected.size && !docsChanged)
      L.push(
        '> ⚠ Capability code changed and no spec/status was touched. If behavior changed, consolidate the spec (G4); otherwise declare "no behavior change" in the PR.',
      );
    if (affected.size && !testsChanged) L.push("> ⚠ No test changed.");
  }
  console.log(L.join("\n"));
}

if (has("--require-adr") && sensitive.length) {
  const body = prBody();
  const missing = sensitive.filter((s) => !body.includes(s.adr));
  if (missing.length) {
    console.error(
      `✖ impact-map: the PR changes a sensitive path and does not cite ${[...new Set(missing.map((s) => s.adr))].join(", ")} (cite the ADR or "does not change the decision of ADR-NNNN")`,
    );
    process.exitCode = 1;
  }
}
