// Claude Code hook utility: reads the JSON from stdin and emits decisions.
export async function readInput() {
  let s = "";
  for await (const c of process.stdin) s += c;
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}
export const askConfirmation = (reason) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
};
export const addContext = (eventName, text) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: eventName, additionalContext: text },
    }),
  );
};
