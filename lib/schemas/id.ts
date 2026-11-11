// lib/schemas/id.ts

/**
 * Validação do `id` que vem na URL (Constitution, Art. VI.1; REQ-CAT-09 e correlatos).
 *
 * Só dígitos, sem sinal, sem zeros à esquerda e até o maior inteiro de 4 bytes do
 * Postgres (as colunas `id` são `Int`). `Number("1e3")`, `Number(" 7")` e
 * `Number("1.5")` seriam aceitos por conversão direta; por isso a checagem é
 * feita no texto, antes de converter.
 */

const ID_MAXIMO = 2_147_483_647;
const FORMATO_ID = /^[1-9][0-9]{0,9}$/;

/** @returns o id como número, ou `null` se o texto não for um id válido. */
export function parseId(valor: string): number | null {
  if (!FORMATO_ID.test(valor)) return null;
  const numero = Number(valor);
  return numero <= ID_MAXIMO ? numero : null;
}
