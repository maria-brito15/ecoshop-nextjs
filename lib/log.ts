// lib/log.ts

/**
 * Log estruturado mínimo (Constitution, Art. XIII.1; REQ-OPS-19).
 *
 * Uma linha JSON por evento, com contexto (rota, dependência, duração...). Nada
 * de segredo: chaves sensíveis do contexto viram `[REDIGIDO]` e credenciais em
 * URLs dentro de textos (`redis://:senha@host`) são mascaradas.
 *
 * Proporcional ao projeto (Art. XIII): sem tracing distribuído nem APM.
 */

type Nivel = "info" | "warn" | "error";

const SENSITIVE_KEY =
  /senha|password|passwd|token|secret|key|authorization|cookie|prediction/i;
const CREDENCIAL_EM_URL = /([a-z][a-z0-9+.-]*:\/\/)[^@\s/]*@/gi;
const PROFUNDIDADE_MAXIMA = 4;

function maskText(text: string): string {
  return text.replace(CREDENCIAL_EM_URL, "$1[REDIGIDO]@");
}

function redigir(valor: unknown, profundidade = 0): unknown {
  if (typeof valor === "string") return maskText(valor);
  if (valor === null || typeof valor !== "object") return valor;
  if (profundidade >= PROFUNDIDADE_MAXIMA) return "[PROFUNDO]";
  if (valor instanceof Error) return serializeError(valor);
  if (Array.isArray(valor)) return valor.map((v) => redigir(v, profundidade + 1));

  const saida: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(valor)) {
    saida[key] = SENSITIVE_KEY.test(key)
      ? "[REDIGIDO]"
      : redigir(v, profundidade + 1);
  }
  return saida;
}

/** Erro → objeto serializável, sem segredos (a pilha é cortada em 6 linhas). */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const codigo = (err as { code?: unknown }).code;
    return {
      nome: err.name,
      mensagem: maskText(err.message),
      ...(typeof codigo === "string" ? { codigo } : {}),
      ...(err.stack
        ? { pilha: maskText(err.stack.split("\n").slice(0, 6).join("\n")) }
        : {}),
    };
  }
  return { valor: maskText(String(err)) };
}

function writeLog(nivel: Nivel, evento: string, context: Record<string, unknown> = {}) {
  const linha = JSON.stringify({
    ts: new Date().toISOString(),
    nivel,
    evento,
    ...(redigir(context) as Record<string, unknown>),
  });
  if (nivel === "error") console.error(linha);
  else if (nivel === "warn") console.warn(linha);
  else console.log(linha);
}

export const log = {
  info: (evento: string, context?: Record<string, unknown>) =>
    writeLog("info", evento, context),
  warn: (evento: string, context?: Record<string, unknown>) =>
    writeLog("warn", evento, context),
  error: (evento: string, context?: Record<string, unknown>) =>
    writeLog("error", evento, context),
};

/**
 * Cria uma função que só deixa passar uma chamada a cada `intervaloMs` por
 * `chave`: evita inundar o log quando uma dependência fica fora do ar.
 */
export function throttle(intervaloMs: number) {
  const ultimo = new Map<string, number>();
  return (key: string, agora: number = Date.now()): boolean => {
    const anterior = ultimo.get(key);
    if (anterior !== undefined && agora - anterior < intervaloMs) return false;
    ultimo.set(key, agora);
    return true;
  };
}
