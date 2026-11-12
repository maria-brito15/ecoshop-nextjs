// lib/schemas/id.ts

/**
 * Validation of the `id` that comes in the URL (Constitution, Art. VI.1; REQ-CAT-09 and related).
 *
 * Digits only, no sign, no leading zeros and up to the largest 4-byte integer of
 * Postgres (the `id` columns are `Int`). `Number("1e3")`, `Number(" 7")` and
 * `Number("1.5")` would be accepted by direct conversion; that is why the check is
 * done on the text, before converting.
 */

const MAX_ID = 2_147_483_647;
const ID_FORMAT = /^[1-9][0-9]{0,9}$/;

/** @returns the id as a number, or `null` if the text is not a valid id. */
export function parseId(value: string): number | null {
  if (!ID_FORMAT.test(value)) return null;
  const number = Number(value);
  return number <= MAX_ID ? number : null;
}
