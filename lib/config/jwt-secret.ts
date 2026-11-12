// lib/config/jwt-secret.ts

/**
 * Acceptance rule for `JWT_SECRET` (Constitution, Art. XII.1; REQ-OPS-06).
 *
 * Pure function: neither reads the environment nor throws. `instrumentation.ts`
 * decides when to validate (at server startup in production).
 */

const MIN_LENGTH = 32;

/**
 * Fragments of sample values that have circulated in the repository or docs.
 * The Portuguese entries are those sample values themselves, kept verbatim on purpose:
 * they are data to reject, not text.
 * Length alone is not enough: the old `.env.example` sample had 38 characters.
 */
const EXAMPLE_SNIPPETS = [
  "supersecretkey",
  "seu-segredo",
  "mude-em",
  "changeme",
  "sua-chave",
];

/**
 * @returns the problem message (never including the value), or `null` if the secret is acceptable.
 */
export function validateJwtSecret(value: string | undefined): string | null {
  if (!value) {
    return "JWT_SECRET is not set. Generate a random value with 32+ characters.";
  }
  if (value.length < MIN_LENGTH) {
    return `JWT_SECRET is too short: use at least ${MIN_LENGTH} characters.`;
  }
  const lowercase = value.toLowerCase();
  if (EXAMPLE_SNIPPETS.some((snippet) => lowercase.includes(snippet))) {
    return "JWT_SECRET looks like a sample value. Generate a random value.";
  }
  return null;
}
