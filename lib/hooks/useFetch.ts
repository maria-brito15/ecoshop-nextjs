// lib/hooks/useFetch.ts

"use client"; // indica que esse hook roda no navegador (não no servidor)

import { useState, useEffect } from "react";

// tipo genérico que representa os 3 estados possíveis de uma requisição
type Estado<T> = {
  data: T | null; // dados retornados pela API (null enquanto não chegou)
  carregando: boolean; // true enquanto a requisição está em andamento
  erro: string | null; // mensagem de erro, caso a requisição falhe
};

// hook genérico para fazer GET em qualquer URL
// o <T> permite tipar o retorno de acordo com quem chama o hook
// ex: useFetch<Produto[]>("/api/produtos") já retorna tipado como Produto[]
export function useFetch<T>(url: string | null) {
  // estado inicial: se a URL já veio preenchida, começa carregando imediatamente
  const [estado, setEstado] = useState<Estado<T>>({
    data: null,
    carregando: !!url, // !! converte a string para boolean (null → false, "/api/..." → true)
    erro: null,
  });

  // roda toda vez que a URL mudar
  useEffect(() => {
    if (!url) return; // se a URL for null, não faz nada (útil para requisições condicionais)

    // reseta o estado antes de cada nova requisição
    setEstado({ data: null, carregando: true, erro: null });

    fetch(url, { credentials: "include" }) // credentials: "include" envia os cookies junto (necessário para autenticação)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`); // lança erro se o status HTTP não for 2xx
        return res.json() as Promise<T>; // converte o body para JSON já tipado como T
      })
      .then((data) => setEstado({ data, carregando: false, erro: null })) // sucesso: salva os dados
      .catch(
        (e) => setEstado({ data: null, carregando: false, erro: e.message }), // falha: salva a mensagem de erro
      );
  }, [url]); // dependência: reexecuta o efeito sempre que a URL mudar

  return estado; // retorna { data, carregando, erro } para quem usar o hook
}
