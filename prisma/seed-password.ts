// prisma/seed-password.ts

/**
 * Validação compartilhada das senhas lidas pelos seeds (REQ-OPS-09).
 *
 * Os seeds não têm senha embutida: sem a variável (ou com uma senha curta) o
 * processo encerra **antes** de abrir conexão com o banco, sem gravar nada.
 */

const MIN_LENGTH = 12;

/**
 * @param variable - nome da variável de ambiente (para a mensagem de erro)
 * @param value - valor lido do ambiente
 * @returns a senha, se válida; caso contrário encerra o processo com código 1
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
