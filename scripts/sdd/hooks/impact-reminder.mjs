#!/usr/bin/env node
// PostToolUse (Edit|Write): reminds which capability/ADR the edited file affects.
import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { entrada, contexto } from "./lib.mjs";

const ev = await entrada();
const alvo = ev.tool_input?.file_path;
if (!alvo) process.exit(0);
const rel = relative(process.cwd(), alvo).replaceAll("\\", "/");
try {
  const out = execFileSync(
    "node",
    ["scripts/sdd/impact-map.mjs", "--arquivos", rel, "--json"],
    { encoding: "utf8" },
  );
  const r = JSON.parse(out);
  const caps = (r.capacidades ?? []).join(", ");
  const adrs = [...new Set((r.sensiveis ?? []).map((x) => x.adr ?? x))].join(
    ", ",
  );
  if (caps || adrs)
    contexto(
      "PostToolUse",
      `Impacto SDD de ${rel}: capacidades [${caps || "nenhuma"}]; ADRs [${adrs || "nenhum"}]. Se o comportamento mudou, atualize o REQ, o teste e o status.md.`,
    );
} catch {
  /* the reminder is optional: it never blocks */
}
