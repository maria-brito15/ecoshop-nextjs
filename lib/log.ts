// lib/log.ts

/**
 * Minimal structured log (Constitution, Art. XIII.1; REQ-OPS-19).
 *
 * One JSON line per event, with context (route, dependency, duration...). No
 * secrets: sensitive context keys become `[REDACTED]` and credentials in URLs
 * inside texts (`redis://:password@host`) are masked.
 *
 * Proportional to the project (Art. XIII): no distributed tracing or APM.
 */

type Level = "info" | "warn" | "error";

const SENSITIVE_KEY =
  /senha|password|passwd|token|secret|key|authorization|cookie|prediction/i;
const CREDENTIAL_IN_URL = /([a-z][a-z0-9+.-]*:\/\/)[^@\s/]*@/gi;
const MAX_DEPTH = 4;

function maskText(text: string): string {
  return text.replace(CREDENTIAL_IN_URL, "$1[REDACTED]@");
}

function redact(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return maskText(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[TOO_DEEP]";
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const output: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : redact(v, depth + 1);
  }
  return output;
}

/** Error → serializable object, without secrets (the stack is cut to 6 lines). */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    return {
      name: err.name,
      message: maskText(err.message),
      ...(typeof code === "string" ? { code } : {}),
      ...(err.stack
        ? { stack: maskText(err.stack.split("\n").slice(0, 6).join("\n")) }
        : {}),
    };
  }
  return { value: maskText(String(err)) };
}

function writeLog(level: Level, event: string, context: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(redact(context) as Record<string, unknown>),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, context?: Record<string, unknown>) =>
    writeLog("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) =>
    writeLog("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) =>
    writeLog("error", event, context),
};

/**
 * Creates a function that only lets one call through per `intervalMs` per
 * `key`: avoids flooding the log when a dependency goes down.
 */
export function throttle(intervalMs: number) {
  const last = new Map<string, number>();
  return (key: string, now: number = Date.now()): boolean => {
    const previous = last.get(key);
    if (previous !== undefined && now - previous < intervalMs) return false;
    last.set(key, now);
    return true;
  };
}
