// lib/http/fetch-with-timeout.ts

/**
 * `fetch` with a time limit (Constitution, Art. VIII.2; REQ-SCAN-09).
 *
 * When the time runs out, the promise rejects (TimeoutError); the caller treats it
 * as a failure of the external dependency.
 */
export function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
