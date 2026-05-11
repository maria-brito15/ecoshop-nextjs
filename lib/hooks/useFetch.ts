// lib/hooks/useFetch.ts

"use client"; // indica que esse hook roda no navegador (não no servidor)

import { useState, useEffect, useRef } from "react";

// tipo genérico que representa os 3 estados possíveis de uma requisição
type Estado<T> = {
  data: T | null;       // dados retornados pela api (null enquanto não chegou)
  carregando: boolean;  // true enquanto a requisição está em andamento
  erro: string | null;  // mensagem de erro, caso a requisição falhe
};

// cache em memória no cliente (map compartilhado entre todas as instâncias do hook)
//
// por que não usar o redis aqui?
// o redis roda no servidor (node.js) — o useFetch roda no navegador
// o cache do servidor fica nas route handlers via lib/cache.ts
// aqui mantemos um map em memória para evitar requisições duplicadas dentro da mesma sessão
//
// estratégia: stale-while-revalidate
//   1. retorna o cache imediatamente, sem tela de loading
//   2. revalida em background de forma silenciosa
//   3. atualiza o estado apenas se os dados mudaram
const memoryCache = new Map<string, { data: unknown; expiraEm: number }>();

// ttl do cache no cliente: 30 segundos
// curto porque o servidor já tem o redis com ttls maiores
const TTL_CLIENTE_MS = 30_000;

function getCached<T>(url: string): T | null {
  const entrada = memoryCache.get(url);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEm) {
    memoryCache.delete(url); // entrada expirada, remove do map
    return null;
  }
  return entrada.data as T;
}

function setCached<T>(url: string, data: T): void {
  memoryCache.set(url, { data, expiraEm: Date.now() + TTL_CLIENTE_MS });
}

// remove do cache do cliente todas as entradas cujo url contém o prefixo informado
// chamada pelo useMutation após mutações bem-sucedidas
export function invalidarCacheCliente(prefixo: string): void {
  for (const chave of memoryCache.keys()) {
    if (chave.includes(prefixo)) memoryCache.delete(chave);
  }
}

// hook genérico para fazer get em qualquer url
// o <T> permite tipar o retorno de acordo com quem chama o hook
// ex: useFetch<Produto[]>("/api/produtos") já retorna tipado como Produto[]
export function useFetch<T>(url: string | null) {
  // inicializa com o cache existente para evitar flash de loading ao navegar
  const dadoInicial = url ? getCached<T>(url) : null;

  const [estado, setEstado] = useState<Estado<T>>({
    data: dadoInicial,
    carregando: !!url && dadoInicial === null, // só mostra loading se não tiver cache
    erro: null,
  });

  // ref para não atualizar estado em componente desmontado (evita memory leak)
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // roda toda vez que a url mudar
  useEffect(() => {
    if (!url) return; // se a url for null, não faz nada (útil para requisições condicionais)

    const cached = getCached<T>(url);

    if (cached !== null) {
      // stale-while-revalidate: mostra o cache imediatamente
      setEstado({ data: cached, carregando: false, erro: null });

      // revalida em background sem mostrar loading
      fetch(url, { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error(`erro ${res.status}`);
          return res.json() as Promise<T>;
        })
        .then((fresh) => {
          setCached(url, fresh);
          // só atualiza o estado se os dados realmente mudaram
          if (montadoRef.current && JSON.stringify(fresh) !== JSON.stringify(cached)) {
            setEstado({ data: fresh, carregando: false, erro: null });
          }
        })
        .catch(() => {
          // revalidação falhou — mantém o cache existente, não exibe erro
        });

      return;
    }

    // cache miss — requisição normal com loading
    setEstado({ data: null, carregando: true, erro: null });

    fetch(url, { credentials: "include" }) // credentials: "include" envia os cookies junto (necessário para autenticação)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`); // lança erro se o status http não for 2xx
        return res.json() as Promise<T>;                     // converte o body para json já tipado como T
      })
      .then((data) => {
        setCached(url, data); // armazena no cache do cliente
        if (montadoRef.current) {
          setEstado({ data, carregando: false, erro: null }); // sucesso: salva os dados
        }
      })
      .catch((e) => {
        if (montadoRef.current) {
          setEstado({ data: null, carregando: false, erro: e.message }); // falha: salva a mensagem de erro
        }
      });
  }, [url]); // dependência: reexecuta o efeito sempre que a url mudar

  return estado; // retorna { data, carregando, erro } para quem usar o hook
}