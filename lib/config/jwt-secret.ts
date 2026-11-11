// lib/config/jwt-secret.ts

/**
 * Regra de aceitação do `JWT_SECRET` (Constitution, Art. XII.1; REQ-OPS-06).
 *
 * Função pura: não lê o ambiente nem lança. Quem decide quando validar é
 * `instrumentation.ts` (na inicialização do servidor em produção).
 */

const MIN_LENGTH = 32;

/**
 * Trechos de valores-exemplo que já circularam no repositório ou em docs.
 * Só o tamanho não basta: o antigo exemplo do `.env.example` tinha 38 caracteres.
 */
const EXAMPLE_SNIPPETS = [
  "supersecretkey",
  "seu-segredo",
  "mude-em",
  "changeme",
  "sua-chave",
];

/**
 * @returns a mensagem do problema (sem nunca incluir o valor), ou `null` se o segredo é aceitável.
 */
export function validateJwtSecret(value: string | undefined): string | null {
  if (!value) {
    return "JWT_SECRET não definido. Gere um valor aleatório com 32+ caracteres.";
  }
  if (value.length < MIN_LENGTH) {
    return `JWT_SECRET curto demais: use pelo menos ${MIN_LENGTH} caracteres.`;
  }
  const lowercase = value.toLowerCase();
  if (EXAMPLE_SNIPPETS.some((snippet) => lowercase.includes(snippet))) {
    return "JWT_SECRET parece um valor-exemplo. Gere um valor aleatório.";
  }
  return null;
}
