#!/usr/bin/env node
// PreToolUse (Bash): pede confirmação para comandos destrutivos.
import { entrada, pedirConfirmacao } from "./lib.mjs";

const ev = await entrada();
const cmd = ev.tool_input?.command ?? "";
const perigoso = [
  [/\bgit\s+push\b.*(--force|-f\b)/, "push forçado"],
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
  [/\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\.\s|\*)/, "remoção recursiva ampla"],
  [
    /\bprisma\s+migrate\s+reset\b|\bprisma\s+db\s+push\b.*--force-reset/,
    "reset do banco",
  ],
  [/\bdrop\s+(database|table)\b/i, "DROP no banco"],
  [
    /\bdocker\s+compose\s+down\b.*(-v|--volumes)/,
    "remoção de volumes do Docker",
  ],
];
for (const [re, nome] of perigoso)
  if (re.test(cmd)) {
    pedirConfirmacao(`Comando destrutivo (${nome}). Confirme.`);
    break;
  }
