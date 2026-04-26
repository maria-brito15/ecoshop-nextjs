"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api");

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number | string;
  fotoUrl?: string;
  categoria?: { id: number; nome: string };
  marca?: { id: number; nome: string; descricao?: string };
  certificados?: {
    certificado: {
      id: number;
      nome: string;
      descricao?: string;
      orgaoEmissor: string;
    };
  }[];
  criadoEm?: string;
}

export default function ProdutoDetailPage() {
  const { id } = useParams();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/produtos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Produto não encontrado");
        return r.json();
      })
      .then((data) => {
        setProduto(data.produto || data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="section container">
        <div className="layout-2col" style={{ alignItems: "start" }}>
          <div
            className="skeleton"
            style={{ aspectRatio: "1", borderRadius: "var(--r-lg)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[60, 40, 80, 120].map((w) => (
              <div
                key={w}
                className="skeleton"
                style={{ height: 20, width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !produto) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
          <h2
            className="h3 heading-serif"
            style={{ marginBottom: "var(--space-4)" }}
          >
            {error || "Produto não encontrado"}
          </h2>
          <Link href="/produtos" className="btn btn--primary">
            ← Voltar aos Produtos
          </Link>
        </div>
      </div>
    );
  }

  const preco =
    typeof produto.preco === "string"
      ? parseFloat(produto.preco)
      : produto.preco;

  return (
    <main className="section">
      <div className="container">
        {/* Breadcrumb */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "var(--space-10)",
            fontSize: "var(--text-sm)",
            color: "var(--text-faint)",
          }}
          aria-label="Breadcrumb"
        >
          <Link href="/" style={{ color: "var(--brand)" }}>
            Início
          </Link>
          <span>›</span>
          <Link href="/produtos" style={{ color: "var(--brand)" }}>
            Produtos
          </Link>
          <span>›</span>
          <span
            className="truncate"
            style={{ color: "var(--text-muted)", maxWidth: 200 }}
          >
            {produto.nome}
          </span>
        </nav>

        <div className="layout-2col" style={{ alignItems: "start" }}>
          {/* Imagem */}
          <div
            className="animate-fadein"
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--r-xl)",
              border: "1.5px solid var(--border)",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {produto.fotoUrl ? (
              <img
                src={produto.fotoUrl}
                alt={produto.nome}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "6rem",
                  background: "var(--bg-muted)",
                  color: "var(--text-faint)",
                }}
              >
                🌿
              </div>
            )}
          </div>

          {/* Info */}
          <div className="animate-fadeup delay-1">
            {/* Badges */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
                marginBottom: "var(--space-5)",
              }}
            >
              {produto.categoria && (
                <Link
                  href={`/produtos?categoria=${produto.categoria.id}`}
                  className="tag"
                >
                  {produto.categoria.nome}
                </Link>
              )}
              {produto.certificados?.map((c) => (
                <span
                  key={c.certificado.id}
                  className="badge badge--accent"
                  style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                >
                  🏅 {c.certificado.nome}
                </span>
              ))}
            </div>

            <h1
              className="heading-serif h2"
              style={{ marginBottom: "var(--space-3)" }}
            >
              {produto.nome}
            </h1>

            {produto.marca && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-5)",
                }}
              >
                por{" "}
                <strong style={{ color: "var(--text-base)" }}>
                  {produto.marca.nome}
                </strong>
              </p>
            )}

            {produto.descricao && (
              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.85,
                  marginBottom: "var(--space-6)",
                }}
              >
                {produto.descricao}
              </p>
            )}

            {/* Preço box */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: "var(--space-5)",
                marginBottom: "var(--space-5)",
              }}
            >
              <div
                className="label-overline"
                style={{ marginBottom: "var(--space-1)" }}
              >
                Preço
              </div>
              <div className="price price--lg">
                R$ {preco.toFixed(2).replace(".", ",")}
              </div>
            </div>

            {/* Sobre a Marca */}
            {produto.marca?.descricao && (
              <div
                style={{
                  background: "var(--brand-subtle)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "var(--space-4) var(--space-5)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: "var(--brand)",
                    marginBottom: "var(--space-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  🏪 Sobre a Marca
                </p>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {produto.marca.descricao}
                </p>
              </div>
            )}

            {/* Certificados */}
            {produto.certificados && produto.certificados.length > 0 && (
              <div style={{ marginBottom: "var(--space-6)" }}>
                <div
                  className="label-overline"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  Certificações
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {produto.certificados.map((c) => (
                    <div
                      key={c.certificado.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "var(--space-4)",
                        background: "var(--bg-surface)",
                        border: "1.5px solid var(--border)",
                        borderRadius: "var(--r-md)",
                      }}
                    >
                      <span style={{ fontSize: "1.5rem" }}>🏅</span>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--text-sm)",
                            marginBottom: 3,
                          }}
                        >
                          {c.certificado.nome}
                        </p>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--text-faint)",
                          }}
                        >
                          Emitido por: {c.certificado.orgaoEmissor}
                        </p>
                        {c.certificado.descricao && (
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--text-muted)",
                              marginTop: 4,
                            }}
                          >
                            {c.certificado.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/produtos" className="btn btn--ghost">
              ← Voltar à listagem
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
