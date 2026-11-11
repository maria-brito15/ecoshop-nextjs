// lib/http/params.ts

import { parseId } from "@/lib/schemas/id";

/**
 * Reads and validates the `id` from Next route params (`{ params: Promise<{ id }> }`).
 *
 * @returns the id, or `null` if invalid (the handler responds 400).
 */
export async function routeId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  return parseId(id);
}
