// prisma/seed-password.ts

/**
 * Shared validation of the passwords read by the seeds (REQ-OPS-09).
 *
 * The seeds have no embedded password: without the variable (or with a short
 * password) the process exits **before** opening a database connection, writing nothing.
 */

const MIN_LENGTH = 12;

/**
 * @param variable - name of the environment variable (for the error message)
 * @param value - value read from the environment
 * @returns the password, if valid; otherwise exits the process with code 1
 */
export function requireSeedPassword(
  variable: string,
  value: string | undefined,
): string {
  if (!value || value.length < MIN_LENGTH) {
    console.error(
      `❌ ${variable} is required and must have at least ${MIN_LENGTH} characters. Nothing was written.`,
    );
    process.exit(1);
  }
  return value;
}
