#!/usr/bin/env node
// PreToolUse (Read): refuses reading a whole large file and guides toward Grep or offset/limit.
// Saves tokens on ~40 KB pages. Adjust the limit with SDD_READ_LIMIT_KB (default 20).
import { statSync } from "node:fs";
import { relative } from "node:path";
import { readInput } from "./lib.mjs";

const deny = (reason) =>
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );

const LIMIT_KB = Number(process.env.SDD_READ_LIMIT_KB ?? 20);
const ev = await readInput();
const { file_path: target, limit } = ev.tool_input ?? {};

// With an explicit `limit`, the read is deliberate: lets it through (it is the escape hatch).
if (!target || limit != null) process.exit(0);

try {
  const kb = statSync(target).size / 1024;
  if (kb > LIMIT_KB) {
    const rel = relative(process.cwd(), target).replaceAll("\\", "/");
    deny(
      `${rel} is ${kb.toFixed(0)} KB (limit ${LIMIT_KB} KB). ` +
        `Use Grep to find the section and Read with offset and limit. ` +
        `If you really need the whole file, repeat the Read with an explicit limit.`,
    );
  }
} catch {
  /* missing or unreadable file: let the Read fail normally */
}
