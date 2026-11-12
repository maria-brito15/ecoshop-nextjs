#!/usr/bin/env node
// PreToolUse (Edit|Write): asks for confirmation when editing the Constitution, an accepted ADR or the frozen baseline.
import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import { entrada, pedirConfirmacao } from "./lib.mjs";

const ev = await entrada();
const alvo = ev.tool_input?.file_path;
if (!alvo) process.exit(0);
const rel = relative(process.cwd(), alvo).replaceAll("\\", "/");

if (rel === ".specify/memory/constitution.md")
  pedirConfirmacao(
    "The Constitution only changes through an amendment approved by the owner. Confirm this was requested.",
  );
else if (rel.startsWith("docs/discovery/"))
  pedirConfirmacao(
    "docs/discovery is a frozen snapshot. Confirm the edit is intentional.",
  );
else if (
  /^docs\/architecture\/adr\/\d{4}-.*\.md$/.test(rel) &&
  existsSync(alvo) &&
  /^[-*\s]*\**Status:?\**:?\s*(Accepted|Aceito)\b/im.test(
    readFileSync(alvo, "utf8"),
  )
)
  pedirConfirmacao(
    "An Accepted ADR is not edited; create an ADR that supersedes it. Confirm this is only a formatting fix.",
  );
