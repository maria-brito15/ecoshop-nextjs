#!/usr/bin/env node
// PostToolUse (Edit|Write): reminds which capability/ADR the edited file affects.
import { execFileSync } from "node:child_process";
import { relative } from "node:path";
import { readInput, addContext } from "./lib.mjs";

const ev = await readInput();
const target = ev.tool_input?.file_path;
if (!target) process.exit(0);
const rel = relative(process.cwd(), target).replaceAll("\\", "/");
try {
  const out = execFileSync(
    "node",
    ["scripts/sdd/impact-map.mjs", "--files", rel, "--json"],
    { encoding: "utf8" },
  );
  const r = JSON.parse(out);
  const caps = (r.capabilities ?? []).join(", ");
  const adrs = [...new Set((r.sensitive ?? []).map((x) => x.adr ?? x))].join(
    ", ",
  );
  if (caps || adrs)
    addContext(
      "PostToolUse",
      `SDD impact of ${rel}: capabilities [${caps || "none"}]; ADRs [${adrs || "none"}]. If behavior changed, update the REQ, the test and status.md.`,
    );
} catch {
  /* the reminder is optional: it never blocks */
}
