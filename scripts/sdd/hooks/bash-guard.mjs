#!/usr/bin/env node
// PreToolUse (Bash): asks for confirmation on destructive commands.
import { readInput, askConfirmation } from "./lib.mjs";

const ev = await readInput();
const cmd = ev.tool_input?.command ?? "";
const dangerous = [
  [/\bgit\s+push\b.*(--force|-f\b)/, "force push"],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
  [/\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\.\s|\*)/, "broad recursive removal"],
  [
    /\bprisma\s+migrate\s+reset\b|\bprisma\s+db\s+push\b.*--force-reset/,
    "database reset",
  ],
  [/\bdrop\s+(database|table)\b/i, "DROP on the database"],
  [/\bdocker\s+compose\s+down\b.*(-v|--volumes)/, "removal of Docker volumes"],
];
for (const [re, name] of dangerous)
  if (re.test(cmd)) {
    askConfirmation(`Destructive command (${name}). Confirm.`);
    break;
  }
