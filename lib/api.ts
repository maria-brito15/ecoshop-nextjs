// lib/api.ts

/**
 * ============================================================================
 * API BASE URL
 * ============================================================================
 * Este módulo fornece a URL base para chamadas de API em diferentes ambientes.
 *
 * O desafio: Next.js roda tanto no servidor quanto no cliente.
 * - No cliente (browser): podemos usar URL relativa "/api"
 * - No servidor: precisamos da URL absoluta (ex: "https://meusite.com/api")
 *
 * Por que isso é necessário?
 * - fetch no servidor não resolve automaticamente URLs relativas
 * - A variável de ambiente NEXT_PUBLIC_SITE_URL permite configurar o domínio
 *   da aplicação (útil em deploys com múltiplos domínios)
 * ============================================================================
 */

/**
 * Retorna a URL base para chamadas de API.
 *
 * Comportamento:
 * - Cliente (typeof window !== "undefined"): retorna "/api"
 * - Servidor: retorna `{NEXT_PUBLIC_SITE_URL}/api` ou fallback "http://localhost:3000/api"
 *
 * @returns {string} URL base da API
 *
 * @example
 * const apiBase = getApiBase();
 * await fetch(`${apiBase}/auth/me`);
 */
export function getApiBase(): string {
  // Modo cliente: URL relativa ao domínio atual.
  // O browser resolve automaticamente para o domínio correto.
  if (typeof window !== "undefined") {
    return "/api";
  }

  // Modo servidor: precisa de URL absoluta.
  // NEXT_PUBLIC_SITE_URL deve ser configurada no ambiente de produção.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/api`;
}
