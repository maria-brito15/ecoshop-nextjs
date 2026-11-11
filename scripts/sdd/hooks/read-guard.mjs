#!/usr/bin/env node
// PreToolUse (Read): refuses reading a whole large file and guides toward Grep or offset/limit.
// Saves tokens on ~40 KB pages. Adjust the limit with SDD_LIMITE_LEITURA_KB (default 20).
import { statSync } from "node:fs";
import { relative } from "node:path";
import { entrada } from "./lib.mjs";

const negar = (motivo) =>
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: motivo,
      },
    }),
  );

const LIMITE_KB = Number(process.env.SDD_LIMITE_LEITURA_KB ?? 20);
const ev = await entrada();
const { file_path: alvo, limit } = ev.tool_input ?? {};

// With an explicit `limit`, the read is deliberate: lets it through (it is the escape hatch).
if (!alvo || limit != null) process.exit(0);

try {
  const kb = statSync(alvo).size / 1024;
  if (kb > LIMITE_KB) {
    const rel = relative(process.cwd(), alvo).replaceAll("\\", "/");
    negar(
      `${rel} tem ${kb.toFixed(0)} KB (limite ${LIMITE_KB} KB). ` +
        `Use Grep para achar o trecho e Read com offset e limit. ` +
        `Se precisar mesmo do arquivo todo, repita o Read com um limit explícito.`,
    );
  }
} catch {
  /* arquivo inexistente ou ilegível: deixa o Read falhar normalmente */
}
