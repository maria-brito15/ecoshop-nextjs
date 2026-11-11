// lib/hooks/useMutation.ts

/**
 * ============================================================================
 * useMutation HOOK
 * ============================================================================
 * Hook React para operações de escrita na API (POST, PUT, DELETE, PATCH).
 *
 * Características:
 * - Gerencia estado de carregamento e erro
 * - Invalida cache automaticamente após sucesso
 * - Suporte a FormData (upload de arquivos)
 * - Compatível com qualquer endpoint REST
 *
 * Diferença do useFetch:
 * - useFetch: usado para GET (leituras)
 * - useMutation: usado para POST/PUT/DELETE (escritas)
 *
 * Padrão de uso:
 * ```tsx
 * const criarProduto = useMutation<Produto, CriarProdutoBody>({
 *   method: "POST",
 *   invalidar: ["/api/produtos"] // invalida cache da listagem
 * });
 *
 * const handleSubmit = async (dados) => {
 *   const resultado = await criarProduto.executar("/api/produtos", dados);
 *   if (resultado) router.push("/produtos");
 * };
 * ```
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { invalidateClientCache } from "./useFetch";

/**
 * Opções de configuração do mutation hook.
 */
type Options = {
  /** Método HTTP da requisição (padrão: POST) */
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  /** Modo de credenciais (padrão: "include" para enviar cookies) */
  credentials?: RequestCredentials;
  /** URLs a invalidar no cache cliente após sucesso */
  invalidate?: string[];
};

/**
 * Formato de resposta de erro esperado da API.
 * A API pode retornar "erro" (português) ou "error" (inglês) conforme rota.
 */
type ApiErrorResponse = { erro?: string; error?: string };

/**
 * Hook para operações de mutação na API.
 *
 * @template TResponse - Tipo dos dados de resposta (sucesso)
 * @template TBody - Tipo do corpo da requisição (pode ser objeto ou FormData)
 * @param options - Configuração do mutation (method, invalidar, etc.)
 * @returns Estado da mutação + função executar
 *
 * @example
 * // DELETE sem corpo
 * const deletar = useMutation<{ ok: boolean }>({ method: "DELETE" });
 * await deletar.executar(`/api/produtos/${id}`);
 *
 * @example
 * // POST com FormData (upload de arquivo)
 * const upload = useMutation<Foto, FormData>({ method: "POST" });
 * const formData = new FormData();
 * formData.append("imagem", file);
 * await upload.executar("/api/fotos", formData);
 */
export function useMutation<TResponse, TBody = unknown>(options?: Options) {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executa a mutação.
   *
   * @param url - URL do endpoint
   * @param body - Corpo da requisição (opcional para DELETE)
   * @returns Dados da resposta ou null em caso de erro
   */
  async function execute(
    url: string,
    body?: TBody,
  ): Promise<TResponse | null> {
    setData(null);
    setLoading(true);
    setError(null);

    try {
      // Detecta se body é FormData (upload de arquivo)
      // Se for, não seta Content-Type (o browser define multipart/form-data corretamente)
      const isFormData = body instanceof FormData;

      const res = await fetch(url, {
        method: options?.method ?? "POST",
        credentials: options?.credentials ?? "include",
        headers: isFormData
          ? undefined
          : { "Content-Type": "application/json" },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      });

      const responseData = (await res.json()) as TResponse;

      if (!res.ok) {
        const errData = responseData as ApiErrorResponse;
        const message = errData.erro ?? errData.error ?? "Unknown error";
        setError(message);
        setLoading(false);
        return null;
      }

      setData(responseData);
      setLoading(false);

      // Invalida caches do cliente para forçar refetch nos próximos useFetch
      // Isso garante que a UI mostre dados atualizados após a mutação
      if (options?.invalidate) {
        options.invalidate.forEach(invalidateClientCache);
      }

      return responseData;
    } catch {
      setError("Connection failure");
      setLoading(false);
      return null;
    }
  }

  return { data, carregando: loading, erro: error, executar: execute };
}
