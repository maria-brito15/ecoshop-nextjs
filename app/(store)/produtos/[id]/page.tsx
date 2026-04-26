"use client";

import { use } from "react";
import Link from "next/link";
import { useBuscarProduto } from "@/lib/hooks/useProdutos";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProdutoPage({ params }: Props) {
  const { id } = use(params);
  const { data, carregando, erro } = useBuscarProduto(Number(id));

  const produto = data?.produto;

  if (carregando) return <p>Carregando...</p>;
  if (erro) return <p style={{ color: "red" }}>{erro}</p>;
  if (!produto) return null;

  return (
    <main>
      <Link href="/produtos">← Voltar</Link>

      <h1>{produto.nome}</h1>
      <p>R$ {produto.preco}</p>

      {produto.descricao && <p>{produto.descricao}</p>}

      <p>Categoria: {produto.categoria.nome}</p>
      <p>Marca: {produto.marca.nome}</p>

      {produto.fotoUrl && (
        <img src={produto.fotoUrl} alt={produto.nome} width={300} />
      )}

      {produto.certificados.length > 0 && (
        <section>
          <h2>Certificados</h2>
          <ul>
            {produto.certificados.map(({ certificado }) => (
              <li key={certificado.id}>
                <strong>{certificado.nome}</strong>
                <span> — {certificado.orgaoEmissor}</span>
                {certificado.descricao && <p>{certificado.descricao}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
