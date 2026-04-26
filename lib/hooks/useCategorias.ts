// lib/hooks/useCategorias.ts

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaCategoriasResponse,
  BuscarCategoriaResponse,
  CriarCategoriaBody,
  CriarCategoriaResponse,
  AtualizarCategoriaBody,
  AtualizarCategoriaResponse,
  OkResponse,
} from "@/types/api";

export function useListarCategorias() {
  return useFetch<ListaCategoriasResponse>("/api/categorias");
}

export function useBuscarCategoria(id: number | null) {
  return useFetch<BuscarCategoriaResponse>(id ? `/api/categorias/${id}` : null);
}

export function useCriarCategoria() {
  return useMutation<CriarCategoriaResponse, CriarCategoriaBody>({
    method: "POST",
  });
}

export function useAtualizarCategoria() {
  return useMutation<AtualizarCategoriaResponse, AtualizarCategoriaBody>({
    method: "PUT",
  });
}

export function useDeletarCategoria() {
  return useMutation<OkResponse>({ method: "DELETE" });
}
