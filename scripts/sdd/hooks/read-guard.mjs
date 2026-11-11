#!/usr/bin/env node
// PreToolUse (Read): recusa a leitura inteira de arquivo grande e orienta a usar Grep ou offset/limit.
// Economiza tokens em páginas de ~40 KB. Ajuste o limite com SDD_LIMITE_LEITURA_KB (padrão 20).
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

// Com `limit` explícito, a leitura é deliberada: deixa passar (é a saída de emergência).
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
