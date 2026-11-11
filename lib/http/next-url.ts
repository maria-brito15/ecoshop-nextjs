// lib/http/next-url.ts

/**
 * Valida o parâmetro `?next=` da tela de login (REQ-AUTH-17).
 *
 * Aceita só caminho local: começa com UMA barra e não tem barra invertida nem
 * caractere de controle. Qualquer outra coisa (`//host`, `https://host`,
 * `/\host`, `javascript:`...) volta para `/`, evitando redirecionamento aberto.
 */
export function caminhoLocalOuRaiz(valor: string | null | undefined): string {
  if (!valor) return "/";
  if (!valor.startsWith("/")) return "/";
  if (valor.startsWith("//")) return "/";
  if (valor.includes("\\")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(valor)) return "/";
  return valor;
}
