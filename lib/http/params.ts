// lib/http/params.ts

import { parseId } from "@/lib/schemas/id";

/**
 * Lê e valida o `id` dos parâmetros de rota do Next (`{ params: Promise<{ id }> }`).
 *
 * @returns o id, ou `null` se for inválido (o handler responde 400).
 */
export async function routeId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  return parseId(id);
}
