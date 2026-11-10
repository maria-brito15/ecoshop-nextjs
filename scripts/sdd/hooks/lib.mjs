// Utilitário dos hooks do Claude Code: lê o JSON do stdin e emite decisões.
export async function entrada() {
  let s = "";
  for await (const c of process.stdin) s += c;
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}
export const pedirConfirmacao = (motivo) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: motivo,
      },
    }),
  );
};
export const contexto = (evento, texto) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: evento, additionalContext: texto },
    }),
  );
};
