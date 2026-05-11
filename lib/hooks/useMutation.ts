// lib/hooks/useMutation.ts

"use client"; // roda apenas no navegador

import { useState } from "react";
import { invalidarCacheCliente } from "./useFetch";

// opções que o hook aceita na criação
type Opcoes = {
  method?: "POST" | "PUT" | "DELETE"; // método http (padrão será post)
  credentials?: RequestCredentials;   // controle de cookies (padrão será "include")

  // prefixos de url para invalidar no cache do cliente após mutação bem-sucedida
  // ex: invalidar: ["/api/produtos"] remove todas as entradas que contêm "/api/produtos"
  // isso inclui urls com query params como /api/produtos?page=1&size=12
  // a invalidação no redis acontece dentro da route handler — aqui só limpamos o cache do navegador
  invalidar?: string[];
};

// mesmo padrão do useFetch: os 3 estados possíveis de uma requisição
type Estado<T> = {
  data: T | null;
  carregando: boolean;
  erro: string | null;
};

// TResponse = tipo do que a api devolve
// TBody = tipo do que você envia no body (unknown por padrão, ou seja, qualquer coisa)
export function useMutation<TResponse, TBody = unknown>(opcoes?: Opcoes) {
  // diferente do useFetch, começa com carregando: false
  // porque a requisição só dispara quando você chamar executar()
  const [estado, setEstado] = useState<Estado<TResponse>>({
    data: null,
    carregando: false,
    erro: null,
  });

  // função que de fato dispara a requisição
  // recebe a url e o body no momento da chamada (não na criação do hook)
  async function executar(
    url: string,
    body?: TBody,
  ): Promise<TResponse | null> {
    setEstado({ data: null, carregando: true, erro: null });

    try {
      const res = await fetch(url, {
        method: opcoes?.method ?? "POST", // usa o método definido nas opções, ou post como padrão
        credentials: opcoes?.credentials ?? "include", // envia cookies por padrão (necessário para auth)

        // se o body for um FormData (upload de arquivo), não define Content-Type
        // o navegador define automaticamente com o boundary correto
        // caso contrário, informa que é json
        headers:
          body instanceof FormData
            ? undefined
            : { "Content-Type": "application/json" },

        // se for FormData, envia direto
        // se for um objeto, serializa para json
        // se não tiver body (ex: delete), não envia nada
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
      });

      // lê o json antes de checar res.ok
      // porque mesmo respostas de erro podem ter um body com detalhes
      const data: TResponse = await res.json();

      if (!res.ok) {
        // tenta pegar a mensagem de erro vinda da api, ou usa um fallback genérico
        const erro = (data as any).erro ?? "Erro desconhecido";
        setEstado({ data: null, carregando: false, erro });
        return null; // retorna null para quem chamou executar() saber que falhou
      }

      setEstado({ data, carregando: false, erro: null });

      // após mutação bem-sucedida, limpa o cache do cliente para os recursos afetados
      // o redis já foi invalidado dentro da route handler pelo invalidarCache()
      if (opcoes?.invalidar) {
        opcoes.invalidar.forEach(invalidarCacheCliente);
      }

      return data; // retorna os dados para quem precisar usar direto (sem depender do estado)
    } catch {
      // catch sem variável: só cai aqui em falha de rede (sem internet, servidor offline, etc.)
      // erros http (404, 500) são tratados pelo if (!res.ok) acima
      setEstado({ data: null, carregando: false, erro: "Falha de conexão" });
      return null;
    }
  }

  // expõe o estado + a função executar juntos
  // uso: const { carregando, erro, executar } = useMutation<Produto>({ method: "PUT" })
  return { ...estado, executar };
}