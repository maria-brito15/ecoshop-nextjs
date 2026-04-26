// lib/hooks/useFetch.ts

"use client";

import { useState, useEffect } from "react";

type Estado<T> = {
  data: T | null;
  carregando: boolean;
  erro: string | null;
};

export function useFetch<T>(url: string | null) {
  const [estado, setEstado] = useState<Estado<T>>({
    data: null,
    carregando: !!url,
    erro: null,
  });

  useEffect(() => {
    if (!url) return;

    setEstado({ data: null, carregando: true, erro: null });

    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => setEstado({ data, carregando: false, erro: null }))
      .catch((e) =>
        setEstado({ data: null, carregando: false, erro: e.message }),
      );
  }, [url]);

  return estado;
}
