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

const CHAVE_SENSIVEL =
  /senha|password|passwd|token|secret|key|authorization|cookie|prediction/i;
const CREDENCIAL_EM_URL = /([a-z][a-z0-9+.-]*:\/\/)[^@\s/]*@/gi;
const PROFUNDIDADE_MAXIMA = 4;

function mascararTexto(texto: string): string {
  return texto.replace(CREDENCIAL_EM_URL, "$1[REDIGIDO]@");
}

function redigir(valor: unknown, profundidade = 0): unknown {
  if (typeof valor === "string") return mascararTexto(valor);
  if (valor === null || typeof valor !== "object") return valor;
  if (profundidade >= PROFUNDIDADE_MAXIMA) return "[PROFUNDO]";
  if (valor instanceof Error) return serializarErro(valor);
  if (Array.isArray(valor)) return valor.map((v) => redigir(v, profundidade + 1));

  const saida: Record<string, unknown> = {};
  for (const [chave, v] of Object.entries(valor)) {
    saida[chave] = CHAVE_SENSIVEL.test(chave)
      ? "[REDIGIDO]"
      : redigir(v, profundidade + 1);
  }
  return saida;
}

/** Erro → objeto serializável, sem segredos (a pilha é cortada em 6 linhas). */
export function serializarErro(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const codigo = (err as { code?: unknown }).code;
    return {
      nome: err.name,
      mensagem: mascararTexto(err.message),
      ...(typeof codigo === "string" ? { codigo } : {}),
      ...(err.stack
        ? { pilha: mascararTexto(err.stack.split("\n").slice(0, 6).join("\n")) }
        : {}),
    };
  }
  return { valor: mascararTexto(String(err)) };
}

function registrar(nivel: Nivel, evento: string, contexto: Record<string, unknown> = {}) {
  const linha = JSON.stringify({
    ts: new Date().toISOString(),
    nivel,
    evento,
    ...(redigir(contexto) as Record<string, unknown>),
  });
  if (nivel === "error") console.error(linha);
  else if (nivel === "warn") console.warn(linha);
  else console.log(linha);
}

export const log = {
  info: (evento: string, contexto?: Record<string, unknown>) =>
    registrar("info", evento, contexto),
  warn: (evento: string, contexto?: Record<string, unknown>) =>
    registrar("warn", evento, contexto),
  error: (evento: string, contexto?: Record<string, unknown>) =>
    registrar("error", evento, contexto),
};

/**
 * Cria uma função que só deixa passar uma chamada a cada `intervaloMs` por
 * `chave`: evita inundar o log quando uma dependência fica fora do ar.
 */
export function limitarFrequencia(intervaloMs: number) {
  const ultimo = new Map<string, number>();
  return (chave: string, agora: number = Date.now()): boolean => {
    const anterior = ultimo.get(chave);
    if (anterior !== undefined && agora - anterior < intervaloMs) return false;
    ultimo.set(chave, agora);
    return true;
  };
}
