"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  categoria?: { nome: string };
  marca?: { nome: string };
}

interface Categoria {
  id: number;
  nome: string;
}

const categoryIcons: Record<string, string> = {
  "Roupas Sustentáveis": "👕",
  "Alimentos Orgânicos": "🥗",
  "Cosméticos Naturais": "🌸",
  "Casa e Decoração": "🏡",
  "Calçados Ecológicos": "👟",
  Alimentação: "🥗",
  Higiene: "🧴",
  Casa: "🏡",
  Moda: "👕",
  Tecnologia: "💻",
  Jardinagem: "🌱",
  Limpeza: "✨",
  Beleza: "🌸",
};

export default function HomePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setErro(false);
    Promise.all([
      fetch(`${API}/produtos?size=4`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .catch(() => ({ produtos: [] })),
      fetch(`${API}/categorias`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .catch(() => []),
    ])
      .then(([pRes, cRes]) => {
        setProdutos(pRes.produtos || []);
        setCategorias(Array.isArray(cRes) ? cRes : cRes.categorias || []);
        setLoading(false);
      })
      .catch(() => {
        setErro(true);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        {/* Blobs decorativos */}
        <div
          className="hero-section__blob"
          style={{
            top: "-15%",
            right: "-8%",
            width: 640,
            height: 640,
            background:
              "radial-gradient(circle, rgba(30,138,90,0.13) 0%, transparent 70%)",
          }}
        />
        <div
          className="hero-section__blob"
          style={{
            bottom: "-10%",
            left: "-6%",
            width: 420,
            height: 420,
            background:
              "radial-gradient(circle, rgba(240,165,0,0.09) 0%, transparent 70%)",
          }}
        />

        <div
          className="container layout-2col animate-fadeup"
          style={{ padding: "5rem 1.5rem" }}
        >
          {/* Coluna de texto */}
          <div>
            <div className="tag" style={{ marginBottom: "1.5rem" }}>
              <span>🌱</span> Consumo Consciente
            </div>

            <h1
              className="heading-serif h1"
              style={{ marginBottom: "1.25rem" }}
            >
              Sua escolha{" "}
              <span style={{ color: "var(--brand)" }}>faz a diferença</span>
            </h1>

            <p
              className="lead"
              style={{ maxWidth: 480, marginBottom: "2.5rem" }}
            >
              Descubra produtos sustentáveis que cuidam de você e do planeta.
              Cada compra é um passo em direção a um futuro mais verde.
            </p>

            <div
              style={{
                display: "flex",
                gap: "var(--space-4)",
                flexWrap: "wrap",
                marginBottom: "var(--space-10)",
              }}
            >
              <Link href="/produtos" className="btn btn--primary btn--lg">
                Explorar Produtos <span>→</span>
              </Link>
              <Link href="/educacao" className="btn btn--outline btn--lg">
                Aprender mais
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-8)",
                flexWrap: "wrap",
              }}
            >
              {[
                { value: "+10", label: "Produtos Eco" },
                { value: "100%", label: "Carbono Neutro" },
                { value: "4.9★", label: "Avaliação" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="heading-serif"
                    style={{ fontSize: "1.9rem", color: "var(--brand)" }}
                  >
                    {s.value}
                  </div>
                  <div className="label-overline">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna de imagem */}
          <div className="animate-fadeup delay-2 hide-mobile">
            <div
              style={{
                position: "relative",
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=700&q=80&fit=crop"
                alt="Estilo de vida sustentável"
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(8px)",
                  padding: "10px 16px",
                  borderRadius: "var(--r-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--brand)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                🏅 Certificado Eco
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  background: "var(--brand)",
                  padding: "10px 16px",
                  borderRadius: "var(--r-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "#fff",
                  boxShadow: "var(--shadow-brand)",
                }}
              >
                ♻️ 100% Reciclável
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUTOS DESTAQUE ─────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="tag">Nossa Seleção</div>
            <h2 className="heading-serif h2">Melhores Produtos</h2>
            <p>
              Curadoria especial de itens que unem design, funcionalidade e
              sustentabilidade.
            </p>
          </div>

          {erro && (
            <div
              className="alert alert--warning"
              style={{ marginBottom: "var(--space-6)" }}
            >
              <span>⚠️</span>
              <span>
                Não foi possível carregar os produtos. Verifique se o servidor
                está rodando.
              </span>
            </div>
          )}

          <div className="grid-cards">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 340 }} />
                ))
            ) : produtos.length > 0 ? (
              produtos.map((p) => <ProductCard key={p.id} produto={p} />)
            ) : (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "3rem 2rem",
                  color: "var(--text-faint)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌿</div>
                <p>
                  Nenhum produto encontrado.{" "}
                  <Link
                    href="/loja"
                    style={{ color: "var(--brand)", fontWeight: 600 }}
                  >
                    Cadastre o primeiro produto →
                  </Link>
                </p>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
            <Link href="/produtos" className="btn btn--outline btn--lg">
              Ver Todos os Produtos →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS ────────────────────────────────────────── */}
      {categorias.length > 0 && (
        <section
          className="section section--sm"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="container">
            <div className="section-header">
              <div className="tag">Navegue por</div>
              <h2 className="heading-serif h2">Categorias</h2>
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/produtos?categoria=${cat.id}`}
                  className="btn btn--outline"
                  style={{
                    borderRadius: "var(--r-lg)",
                    padding: "12px 20px",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>
                    {categoryIcons[cat.nome] || "🌿"}
                  </span>
                  {cat.nome}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EDUCAÇÃO CTA ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div
            className="layout-2col"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-active) 0%, var(--brand) 100%)",
              borderRadius: "var(--r-xl)",
              padding: "clamp(2rem, 4vw, 3.5rem)",
              color: "#fff",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 16px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "var(--r-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "var(--space-5)",
                }}
              >
                📚 Aprenda
              </span>
              <h2
                className="heading-serif h2"
                style={{ color: "#fff", marginBottom: "var(--space-4)" }}
              >
                Centro Educativo EcoShop
              </h2>
              <p
                style={{
                  opacity: 0.85,
                  lineHeight: 1.8,
                  marginBottom: "var(--space-8)",
                  maxWidth: 400,
                }}
              >
                A sustentabilidade vai além da compra. Acesse nossos guias e
                aprenda como suas pequenas atitudes transformam o mundo.
              </p>
              <Link
                href="/educacao"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  background: "#fff",
                  color: "var(--brand)",
                  borderRadius: "var(--r-full)",
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  transition: "all var(--dur-fast) var(--ease)",
                }}
              >
                Acessar Conteúdo Educativo →
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                justifyContent: "center",
              }}
            >
              {[
                {
                  icon: "📖",
                  title: "Guias Práticos",
                  desc: "Dicas para reduzir resíduos em casa.",
                },
                {
                  icon: "🌍",
                  title: "Impacto Real",
                  desc: "Entenda o ciclo de vida dos produtos.",
                },
                {
                  icon: "🤖",
                  title: "IA Scan",
                  desc: "Identifique resíduos com inteligência artificial.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--r-md)",
                    padding: "var(--space-4) var(--space-5)",
                  }}
                >
                  <span style={{ fontSize: "1.6rem" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 3 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", opacity: 0.75 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── IA SCAN TEASER ────────────────────────────────────── */}
      <section
        className="section section--sm"
        style={{ background: "var(--bg-surface)" }}
      >
        <div
          className="container"
          style={{ maxWidth: 600, textAlign: "center" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0b1d13, #163225)",
              borderRadius: "var(--r-xl)",
              padding: "clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "var(--space-4)" }}>
              🤖
            </div>
            <h2
              className="heading-serif h2"
              style={{ color: "#fff", marginBottom: "var(--space-3)" }}
            >
              EcoScan <span style={{ color: "var(--brand)" }}>IA</span>
            </h2>
            <p
              style={{
                color: "var(--text-faint)",
                lineHeight: 1.8,
                marginBottom: "var(--space-6)",
              }}
            >
              Use nossa inteligência artificial para identificar resíduos e
              descobrir o descarte correto em segundos.
            </p>
            <Link
              href="/ia-scan"
              className="btn btn--primary btn--lg"
              style={{ boxShadow: "0 4px 24px rgba(30,138,90,0.4)" }}
            >
              ✨ Testar Agora
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductCard({ produto }: { produto: Produto }) {
  const preco =
    typeof produto.preco === "string"
      ? parseFloat(produto.preco)
      : produto.preco;

  return (
    <Link href={`/produtos/${produto.id}`} className="product-card">
      <div className="product-card__img">
        {produto.fotoUrl ? (
          <img src={produto.fotoUrl} alt={produto.nome} />
        ) : (
          <div className="product-card__placeholder">🌿</div>
        )}
        {produto.categoria && (
          <span className="product-card__category">
            {produto.categoria.nome}
          </span>
        )}
      </div>
      <div className="product-card__body">
        {produto.marca && (
          <p className="product-card__brand">{produto.marca.nome}</p>
        )}
        <h3 className="product-card__name">{produto.nome}</h3>
        <div className="product-card__footer">
          <span className="price price--sm">
            R$ {preco.toFixed(2).replace(".", ",")}
          </span>
          <span className="badge badge--brand">Ver mais →</span>
        </div>
      </div>
    </Link>
  );
}
