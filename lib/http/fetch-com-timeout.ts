// lib/http/fetch-com-timeout.ts

/**
 * `fetch` com tempo limite (Constitution, Art. VIII.2; REQ-SCAN-09).
 *
 * Estourado o prazo, a promessa rejeita (TimeoutError); o chamador trata como
 * falha da dependência externa.
 */
export function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
