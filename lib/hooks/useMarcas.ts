// lib/hooks/useMarcas.ts

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaMarcasResponse,
  BuscarMarcaResponse,
  CriarMarcaBody,
  CriarMarcaResponse,
  AtualizarMarcaBody,
  AtualizarMarcaResponse,
  OkResponse,
} from "@/types/api";

export function useListarMarcas() {
  return useFetch<ListaMarcasResponse>("/api/marcas");
}

export function useBuscarMarca(id: number | null) {
  return useFetch<BuscarMarcaResponse>(id ? `/api/marcas/${id}` : null);
}

export function useCriarMarca() {
  return useMutation<CriarMarcaResponse, CriarMarcaBody>({ method: "POST" });
}

export function useAtualizarMarca() {
  return useMutation<AtualizarMarcaResponse, AtualizarMarcaBody>({
    method: "PUT",
  });
}

export function useDeletarMarca() {
  return useMutation<OkResponse>({ method: "DELETE" });
}
