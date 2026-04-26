// app/(store)/produtos/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useListarProdutos } from "@/lib/hooks/useProdutos";

export default function ProdutosPage() {
  const [page, setPage] = useState(1);
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");

  const { data, carregando, erro } = useListarProdutos(
    page,
    12,
    undefined,
    busca,
  );

  const produtos = data?.produtos ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / 12);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(nome);
  }

  return (
    <main>
      <h1>Produtos</h1>

      <form onSubmit={handleBuscar}>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

      {carregando && <p>Carregando...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {!carregando && !erro && produtos.length === 0 && (
        <p>Nenhum produto encontrado.</p>
      )}

      <ul>
        {produtos.map((produto) => (
          <li key={produto.id}>
            <Link href={`/produtos/${produto.id}`}>
              <strong>{produto.nome}</strong>
            </Link>
            <span> — R$ {produto.preco}</span>
            <span> | {produto.categoria.nome}</span>
            <span> | {produto.marca.nome}</span>
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <div>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            Anterior
          </button>
          <span>
            {" "}
            Página {page} de {totalPaginas}{" "}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPaginas}
          >
            Próxima
          </button>
        </div>
      )}
    </main>
  );
}
