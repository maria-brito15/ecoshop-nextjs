// lib/hooks/useProdutos.ts

import { useFetch } from "./useFetch";
import { useMutation } from "./useMutation";
import type {
  ListaProdutosResponse,
  BuscarProdutoResponse,
  CriarProdutoBody,
  CriarProdutoResponse,
  AtualizarProdutoBody,
  AtualizarProdutoResponse,
} from "@/types/api";

export function useListarProdutos(
  page = 1,
  size = 12,
  categoriaId?: number,
  nome?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (categoriaId) params.set("categoriaId", String(categoriaId));
  if (nome) params.set("nome", nome);

  return useFetch<ListaProdutosResponse>(`/api/produtos?${params}`);
}

export function useBuscarProduto(id: number | null) {
  return useFetch<BuscarProdutoResponse>(id ? `/api/produtos/${id}` : null);
}

export function useCriarProduto() {
  return useMutation<CriarProdutoResponse, CriarProdutoBody>({
    method: "POST",
    invalidar: ["/api/produtos"], // limpa a lista após criar
  });
}

export function useAtualizarProduto() {
  return useMutation<AtualizarProdutoResponse, AtualizarProdutoBody>({
    method: "PUT",
    invalidar: ["/api/produtos"], // limpa lista e item após editar
  });
}

export function useDeletarProduto() {
  return useMutation<{ ok: boolean }>({
    method: "DELETE",
    invalidar: ["/api/produtos"],
  });
}
