// lib/http/next-url.ts

/**
 * Valida o parâmetro `?next=` da tela de login (REQ-AUTH-17).
 *
 * Aceita só caminho local: começa com UMA barra e não tem barra invertida nem
 * caractere de controle. Qualquer outra coisa (`//host`, `https://host`,
 * `/\host`, `javascript:`...) volta para `/`, evitando redirecionamento aberto.
 */
export function localPathOrRoot(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value;
}
