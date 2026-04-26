// app/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Produto {
  id: number;
  nome: string;
  preco: number | string;
  categoria?: { nome: string };
  marca?: { nome: string };
}

interface Categoria {
  id: number;
  nome: string;
}

export default function HomePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/produtos?size=4")
        .then((r) => r.json())
        .catch(() => ({ produtos: [] })),
      fetch("/api/categorias")
        .then((r) => r.json())
        .catch(() => ({ categorias: [] })),
    ]).then(([pRes, cRes]) => {
      setProdutos(pRes.produtos ?? []);
      setCategorias(cRes.categorias ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <main>
      <section>
        <h1>Sua escolha faz a diferença</h1>
        <p>Descubra produtos sustentáveis que cuidam de você e do planeta.</p>
        <Link href="/produtos">Explorar Produtos</Link>
        {" | "}
        <Link href="/educacao">Aprender mais</Link>
      </section>

      <section>
        <h2>Melhores Produtos</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : produtos.length > 0 ? (
          <ul>
            {produtos.map((p) => {
              const preco =
                typeof p.preco === "string" ? parseFloat(p.preco) : p.preco;
              return (
                <li key={p.id}>
                  <Link href={`/produtos/${p.id}`}>
                    {p.nome} — R$ {preco.toFixed(2).replace(".", ",")}
                    {p.marca && ` | ${p.marca.nome}`}
                    {p.categoria && ` | ${p.categoria.nome}`}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Nenhum produto encontrado.</p>
        )}
        <Link href="/produtos">Ver todos os produtos</Link>
      </section>

      {categorias.length > 0 && (
        <section>
          <h2>Categorias</h2>
          <ul>
            {categorias.map((cat) => (
              <li key={cat.id}>
                <Link href={`/produtos?categoriaId=${cat.id}`}>{cat.nome}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Centro Educativo EcoShop</h2>
        <p>
          Acesse nossos guias e aprenda como suas pequenas atitudes transformam
          o mundo.
        </p>
        <Link href="/educacao">Acessar Conteúdo Educativo</Link>
      </section>

      <section>
        <h2>EcoScan IA</h2>
        <p>
          Use nossa IA para identificar resíduos e descobrir o descarte correto.
        </p>
        <Link href="/ia-scan">Testar Agora</Link>
      </section>
    </main>
  );
}
