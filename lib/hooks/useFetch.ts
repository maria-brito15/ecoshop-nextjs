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

import { useState, useEffect } from "react";

/**
 * Estado interno do hook.
 * @template T - Tipo dos dados retornados pela API
 */
type Estado<T> = {
  /** Dados da requisição (null enquanto carrega ou em erro) */
  data: T | null;
  /** Indica se a requisição está em andamento */
  carregando: boolean;
  /** Mensagem de erro (null se não houver erro) */
  erro: string | null;
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
const TTL_CLIENTE_MS = 30_000; // 30 segundos (menor que cache do Redis no servidor)

/**
 * Recupera dados do cache se ainda não expiraram.
 * @template T - Tipo dos dados armazenados
 * @param url - URL da requisição (chave do cache)
 * @returns Dados cacheados ou null
 */
function getCached<T>(url: string): T | null {
  const entrada = memoryCache.get(url);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEm) {
    memoryCache.delete(url);
    return null;
  }
  return entrada.data as T;
}

/**
 * Armazena dados no cache com TTL fixo.
 * @template T - Tipo dos dados armazenados
 * @param url - URL da requisição (chave do cache)
 * @param data - Dados a serem armazenados
 */
function setCached<T>(url: string, data: T): void {
  memoryCache.set(url, { data, expiraEm: Date.now() + TTL_CLIENTE_MS });
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
export function invalidarCacheCliente(prefixo: string): void {
  for (const chave of memoryCache.keys()) {
    if (chave.includes(prefixo)) memoryCache.delete(chave);
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
  const dadoInicial = url ? getCached<T>(url) : null;
  const [estado, setEstado] = useState<Estado<T>>({
    data: dadoInicial,
    carregando: !!url && dadoInicial === null, // carrega se não tem cache
    erro: null,
  });

  /**
   * Executa a requisição manualmente.
   * Útil para refetch após ações do usuário.
   *
   * @param customUrl - URL opcional (sobrescreve a URL do hook)
   * @returns Dados da requisição ou null em caso de erro
   */
  const executar = async (customUrl?: string): Promise<T | null> => {
    const urlParaFetch = customUrl || url;
    if (!urlParaFetch) return null;

    setEstado({ data: null, carregando: true, erro: null });

    try {
      const res = await fetch(urlParaFetch, {
        credentials: "include", // envia cookie httpOnly com token JWT
        ...options,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = (await res.json()) as T;
      setCached(urlParaFetch, data);
      setEstado({ data, carregando: false, erro: null });
      return data;
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
      setEstado({ data: null, carregando: false, erro: mensagem });
      return null;
    }
  };

  // Efeito para execução automática quando a URL muda
  useEffect(() => {
    let ativo = true;
    if (!url) return;

    const cached = getCached<T>(url);

    // Caso 1: Tem cache válido → exibe e revalida em background
    if (cached !== null) {
      setEstado({ data: cached, carregando: false, erro: null });

      // Revalidação silenciosa: atualiza cache se dados mudaram
      fetch(url, { credentials: "include", ...options })
        .then((res) => {
          if (!res.ok) throw new Error(`erro ${res.status}`);
          return res.json() as Promise<T>;
        })
        .then((fresh) => {
          setCached(url, fresh);
          // Só atualiza UI se dados realmente mudaram (evita re-render desnecessário)
          if (ativo && JSON.stringify(fresh) !== JSON.stringify(cached)) {
            setEstado({ data: fresh, carregando: false, erro: null });
          }
        })
        .catch(() => {
          // Silencia erro na revalidação em background
          // O usuário já vê os dados do cache, então falha não é crítica
        });
      return;
    }

    // Caso 2: Sem cache → faz requisição normal
    executar();

    return () => {
      ativo = false;
    };
  }, [url]); // Re-executa se a URL mudar

  return { ...estado, executar };
}
