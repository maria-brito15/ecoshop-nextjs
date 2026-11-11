// lib/hooks/useFetch.ts - VERSÃO CORRIGIDA (sem logs)

/**
 * ============================================================================
 * useFetch HOOK
 * ============================================================================
 * Hook React para busca de dados com cache automático no cliente.
 *
 * Características:
 * - Cache em memória com TTL de 30 segundos (evita requisições duplicadas)
 * - Stale-while-revalidate: mostra dados do cache enquanto atualiza em background
 * - Suporte a SSR/hidratação (usa cache inicial se disponível)
 *
 * Por que cache no cliente?
 * - Reduz chamadas de rede em navegações entre páginas
 * - Melhora a experiência do usuário (dados aparecem instantaneamente)
 * - Dados são revalidados em background para manter consistência
 *
 * Padrão de uso:
 * ```tsx
 * const { data, carregando, erro, executar } = useFetch<Produto[]>("/api/produtos");
 *
 * if (carregando) return <Spinner />;
 * if (erro) return <ErrorMessage>{erro}</ErrorMessage>;
 * return <ProductList produtos={data} />;
 * ```
 * ============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Estado interno do hook.
 * @template T - Tipo dos dados retornados pela API
 */
type State<T> = {
  /** Dados da requisição (null enquanto carrega ou em erro) */
  data: T | null;
  /** Indica se a requisição está em andamento */
  loading: boolean;
  /** Mensagem de erro (null se não houver erro) */
  error: string | null;
};

/**
 * Cache simples em memória para evitar requisições duplicadas.
 * - Chave: URL completa da requisição
 * - Valor: dados + timestamp de expiração
 *
 * TTL de 30 segundos: equilíbrio entre dados atualizados e performance.
 * Para dados que mudam com frequência, use TTL menor ou desabilite cache.
 */
const memoryCache = new Map<string, { data: unknown; expiraEm: number }>();
const CLIENT_TTL_MS = 30_000; // 30 segundos (menor que cache do Redis no servidor)

/**
 * Recupera dados do cache se ainda não expiraram.
 * @template T - Tipo dos dados armazenados
 * @param url - URL da requisição (chave do cache)
 * @returns Dados cacheados ou null
 */
function getCached<T>(url: string): T | null {
  const entry = memoryCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiraEm) {
    memoryCache.delete(url);
    return null;
  }
  return entry.data as T;
}

/**
 * Armazena dados no cache com TTL fixo.
 * @template T - Tipo dos dados armazenados
 * @param url - URL da requisição (chave do cache)
 * @param data - Dados a serem armazenados
 */
function setCached<T>(url: string, data: T): void {
  memoryCache.set(url, { data, expiraEm: Date.now() + CLIENT_TTL_MS });
}

/**
 * Invalida todas as entradas do cache cuja URL contém um prefixo específico.
 * Usado após mutations (POST/PUT/DELETE) para garantir dados frescos.
 *
 * @param prefixo - Prefixo da URL a invalidar (ex: "/api/produtos")
 *
 * @example
 * // Após criar um novo produto, invalida todos os caches de listagem
 * invalidarCacheCliente("/api/produtos");
 */
/**
 * Esvazia TODO o cache do cliente. Chamado no logout e ao abrir uma sessão nova:
 * o cache é por URL (não por usuário), então sem isso a próxima pessoa que usa a
 * mesma aba veria os dados da anterior por até 30 s.
 */
export function clearClientCache(): void {
  memoryCache.clear();
}

export function invalidateClientCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) memoryCache.delete(key);
  }
}

/**
 * Hook para buscar dados de API com cache automático.
 *
 * @template T - Tipo dos dados retornados pela API
 * @param url - URL da requisição (se null, o hook não executa)
 * @param options - Opções adicionais do fetch (headers, etc.)
 * @returns Estado da requisição + função executar para refetch manual
 *
 * Estratégia de cache:
 * 1. Se existe cache válido → exibe instantaneamente
 * 2. Faz fetch em background para revalidar
 * 3. Se dados novos são diferentes, atualiza a UI
 *
 * @example
 * // Uso básico
 * const { data, carregando, erro } = useFetch<Usuario>("/api/auth/me");
 *
 * @example
 * // Com refetch manual
 * const { data, executar } = useFetch<Produto>("/api/produtos");
 * const refresh = () => executar("/api/produtos?page=2");
 */
export function useFetch<T>(url: string | null, options?: RequestInit) {
  // Tenta obter dados do cache na montagem do hook
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const initialData = url ? getCached<T>(url) : null;
  const [state, setState] = useState<State<T>>({
    data: initialData,
    loading: !!url && initialData === null, // carrega se não tem cache
    error: null,
  });

  /**
   * Executa a requisição manualmente.
   * Útil para refetch após ações do usuário.
   *
   * @param customUrl - URL opcional (sobrescreve a URL do hook)
   * @returns Dados da requisição ou null em caso de erro
   */
  const execute = async (customUrl?: string): Promise<T | null> => {
    const urlToFetch = customUrl || url;
    if (!urlToFetch) return null;

    setState({ data: null, loading: true, error: null });

    try {
      const res = await fetch(urlToFetch, {
        credentials: "include", // envia cookie httpOnly com token JWT
        ...optionsRef.current,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as T;
      setCached(urlToFetch, data);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: message });
      return null;
    }
  };

  // Efeito para execução automática quando a URL muda
  useEffect(() => {
    let active = true;
    if (!url) return;

    const cached = getCached<T>(url);

    // Caso 1: Tem cache válido → exibe e revalida em background
    if (cached !== null) {
      setState({ data: cached, loading: false, error: null });
      const controller = new AbortController();

      // Revalidação silenciosa: atualiza cache se dados mudaram
      fetch(url, {
        credentials: "include",
        ...optionsRef.current,
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`error ${res.status}`);
          return res.json() as Promise<T>;
        })
        .then((fresh) => {
          setCached(url, fresh);
          // Só atualiza UI se dados realmente mudaram (evita re-render desnecessário)
          if (active && JSON.stringify(fresh) !== JSON.stringify(cached)) {
            setState({ data: fresh, loading: false, error: null });
          }
        })
        .catch(() => {
          // Silencia erro na revalidação em background
          // O usuário já vê os dados do cache, então falha não é crítica
        });
      return () => {
        active = false;
        controller.abort(); // desmontou ou a URL mudou: cancela a revalidação
      };
    }

    // Caso 2: Sem cache → faz requisição normal
    execute();

    return () => {
      active = false;
    };
    // `executar` e `options` ficam de fora de propósito: `options` costuma ser um
    // objeto literal novo a cada render (incluí-lo refaria a requisição sem parar);
    // a versão mais recente dele é lida por `optionsRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Re-executa se a URL mudar

  return { ...state, executar: execute };
}
