/**
 * Retorna a URL base da API.
 * No browser, usa caminho relativo para funcionar em qualquer ambiente.
 * No servidor (SSR/SSG), usa a variável de ambiente NEXT_PUBLIC_API_URL ou localhost.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    // Client-side: usa caminho relativo — funciona em qualquer host/porta
    return "/api";
  }
  // Server-side: usa variável de ambiente ou fallback
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
}
