// prisma/senha-seed.ts

/**
 * Validação compartilhada das senhas lidas pelos seeds (REQ-OPS-09).
 *
 * Os seeds não têm senha embutida: sem a variável (ou com uma senha curta) o
 * processo encerra **antes** de abrir conexão com o banco, sem gravar nada.
 */

const TAMANHO_MINIMO = 12;

/**
 * @param variavel - nome da variável de ambiente (para a mensagem de erro)
 * @param valor - valor lido do ambiente
 * @returns a senha, se válida; caso contrário encerra o processo com código 1
 */
export function requireSeedPassword(
  variavel: string,
  valor: string | undefined,
): string {
  if (!valor || valor.length < TAMANHO_MINIMO) {
    console.error(
      `❌ ${variavel} é obrigatória e deve ter pelo menos ${TAMANHO_MINIMO} caracteres. Nada foi gravado.`,
    );
    process.exit(1);
  }
  return valor;
}
