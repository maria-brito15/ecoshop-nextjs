// lib/hooks/useMutation.ts

"use client";

import { useState } from "react";

type Opcoes = {
  method?: "POST" | "PUT" | "DELETE";
  credentials?: RequestCredentials;
};

type Estado<T> = {
  data: T | null;
  carregando: boolean;
  erro: string | null;
};

export function useMutation<TResponse, TBody = unknown>(opcoes?: Opcoes) {
  const [estado, setEstado] = useState<Estado<TResponse>>({
    data: null,
    carregando: false,
    erro: null,
  });

  async function executar(
    url: string,
    body?: TBody,
  ): Promise<TResponse | null> {
    setEstado({ data: null, carregando: true, erro: null });

    try {
      const res = await fetch(url, {
        method: opcoes?.method ?? "POST",
        credentials: opcoes?.credentials ?? "include",
        headers:
          body instanceof FormData
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
      });

      const data: TResponse = await res.json();

      if (!res.ok) {
        const erro = (data as any).erro ?? "Erro desconhecido";
        setEstado({ data: null, carregando: false, erro });
        return null;
      }

      setEstado({ data, carregando: false, erro: null });
      return data;
    } catch {
      setEstado({ data: null, carregando: false, erro: "Falha de conexão" });
      return null;
    }
  }

  return { ...estado, executar };
}
