// lib/hooks/useFotos.ts

"use client";

import { useState, useCallback } from "react";

export interface Foto {
  nome: string;
  url: string;
}

export interface FotosResponse {
  fotos: Foto[];
  total: number;
  produtoId: number;
}

export function useFotos(produtoId: number) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/fotos`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar fotos");
      }

      const data: FotosResponse = await res.json();
      setFotos(data.fotos);
    } catch (err: any) {
      setErro(err.message || "Erro ao carregar fotos");
    } finally {
      setCarregando(false);
    }
  }, [produtoId]);

  const upload = useCallback(
    async (arquivo: File, nomeCustomizado?: string) => {
      setErro(null);
      try {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        if (nomeCustomizado) {
          formData.append("nome", nomeCustomizado);
        }

        const res = await fetch(`/api/produtos/${produtoId}/fotos`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao fazer upload");
        }

        const data = await res.json();

        setFotos((prev) => [...prev, data.foto]);

        return data.foto;
      } catch (err: any) {
        const mensagem = err.message || "Erro ao fazer upload";
        setErro(mensagem);
        throw err;
      }
    },
    [produtoId],
  );

  const deletar = useCallback(
    async (nomeArquivo: string) => {
      setErro(null);
      try {
        const res = await fetch(
          `/api/produtos/${produtoId}/fotos?nome=${encodeURIComponent(nomeArquivo)}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao deletar foto");
        }

        setFotos((prev) => prev.filter((f) => f.nome !== nomeArquivo));
      } catch (err: any) {
        const mensagem = err.message || "Erro ao deletar foto";
        setErro(mensagem);
        throw err;
      }
    },
    [produtoId],
  );

  return {
    fotos,
    carregando,
    erro,
    carregar,
    upload,
    deletar,
  };
}
