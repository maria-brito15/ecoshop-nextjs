#!/usr/bin/env node
// PreToolUse (Edit|Write): asks for confirmation when editing the Constitution, an accepted ADR or the frozen baseline.
import { readFileSync, existsSync } from "node:fs";
import { relative } from "node:path";
import { readInput, askConfirmation } from "./lib.mjs";

const ev = await readInput();
const target = ev.tool_input?.file_path;
if (!target) process.exit(0);
const rel = relative(process.cwd(), target).replaceAll("\\", "/");

if (rel === ".specify/memory/constitution.md")
  askConfirmation(
    "The Constitution only changes through an amendment approved by the owner. Confirm this was requested.",
  );
else if (rel.startsWith("docs/discovery/"))
  askConfirmation(
    "docs/discovery is a frozen snapshot. Confirm the edit is intentional.",
  );
else if (
  /^docs\/architecture\/adr\/\d{4}-.*\.md$/.test(rel) &&
  existsSync(target) &&
  /^[-*\s]*\**Status:?\**:?\s*Accepted\b/im.test(readFileSync(target, "utf8"))
)
  askConfirmation(
    "An Accepted ADR is not edited; create an ADR that supersedes it. Confirm this is only a formatting fix.",
  );
