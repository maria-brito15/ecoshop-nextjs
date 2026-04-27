// app/(store)/produtos/[id]/page.tsx

"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useBuscarProduto } from "@/lib/hooks/useProdutos";
import type { Certificado } from "@/types/api";

type Props = {
  params: Promise<{ id: string }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON (loading state)
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      <div className="container-eco py-6">
        {/* breadcrumb skeleton */}
        <div className="h-5 w-36 bg-[var(--color-bg-surface)] rounded-full animate-pulse mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12">
          {/* image skeleton */}
          <div className="aspect-square bg-[var(--color-bg-surface)] rounded-[2rem] animate-pulse border border-[var(--color-border)]" />

          {/* info skeleton */}
          <div className="flex flex-col gap-5 pt-4">
            <div className="h-4 w-24 bg-[var(--color-bg-surface)] rounded-full animate-pulse" />
            <div className="h-10 w-3/4 bg-[var(--color-bg-surface)] rounded-xl animate-pulse" />
            <div className="h-10 w-3/4 bg-[var(--color-bg-surface)] rounded-xl animate-pulse" />
            <div className="h-8 w-1/3 bg-[var(--color-bg-surface)] rounded-full animate-pulse mt-2" />
            <div className="h-14 w-full bg-[var(--color-bg-surface)] rounded-full animate-pulse mt-4" />
            <div className="h-36 w-full bg-[var(--color-bg-surface)] rounded-2xl animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE BADGE
// ─────────────────────────────────────────────────────────────────────────────
function CertBadge({ cert }: { cert: Certificado }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-body)] transition-all hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-primary)] text-base">✦</span>
        <span className="font-bold text-sm text-[var(--color-text-primary)] font-display">
          {cert.nome}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)] pl-6">
        {cert.orgaoEmissor}
      </span>
      {cert.descricao && (
        <p className="text-xs text-[var(--color-text-secondary)] pl-6 leading-relaxed mt-0.5">
          {cert.descricao}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT CARD (simulated eco data)
// ─────────────────────────────────────────────────────────────────────────────
function ImpactCard({ preco }: { preco: string }) {
  const val = parseFloat(preco);
  const co2 = (val * 0.012).toFixed(1) + "kg";
  const water = Math.round(val * 0.8) + "L";
  const trees = val > 200 ? "2" : "1";

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-4 text-[var(--color-primary)] font-bold text-sm font-display uppercase tracking-wide">
        <span>🌍</span>
        <span>Impacto Positivo</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: co2, label: "CO₂ Evitado" },
          { value: water, label: "Água Poupada" },
          { value: trees, label: "Árvores" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-[var(--color-bg-body)]"
          >
            <span className="text-xl font-extrabold font-display text-[var(--color-text-primary)] leading-tight">
              {value}
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "sobre" | "specs" | "certificados";

function Tabs({
  activeTab,
  onTabChange,
  hasCerts,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  hasCerts: boolean;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "sobre", label: "Sobre o Produto" },
    { id: "specs", label: "Ficha Técnica" },
    ...(hasCerts ? [{ id: "certificados" as Tab, label: "Certificados" }] : []),
  ];

  return (
    <nav className="flex border-b border-[var(--color-border)] overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`
            px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px
            ${
              activeTab === t.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-bg-surface)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-surface-hover)]"
            }
          `}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProdutoPage({ params }: Props) {
  const { id } = use(params);
  const { data, carregando, erro } = useBuscarProduto(Number(id));
  const [activeTab, setActiveTab] = useState<Tab>("sobre");
  const [imgLoaded, setImgLoaded] = useState(false);

  // Animate-on-mount ref
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  if (carregando) return <SkeletonDetail />;

  if (erro) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-body)] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Produto não encontrado
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{erro}</p>
          <Link href="/produtos" className="btn-primary">
            ← Voltar para produtos
          </Link>
        </div>
      </main>
    );
  }

  if (!data?.produto) return null;

  const produto = data.produto;

  const precoFormatado = parseFloat(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const parcelas = 12;
  const valorParcela = (parseFloat(produto.preco) / parcelas).toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" },
  );

  const hasCerts = produto.certificados.length > 0;

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)] pb-20">
      {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
      <div className="container-eco pt-6 pb-2">
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <span
            className="transition-transform group-hover:-translate-x-1 inline-block"
            aria-hidden
          >
            ←
          </span>
          Voltar para produtos
        </Link>
      </div>

      {/* ── HERO: IMAGE + INFO ─────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="container-eco"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(28px)",
          transition:
            "opacity 0.7s ease, transform 0.7s cubic-bezier(0.2,1,0.3,1)",
        }}
      >
        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 mt-4 mb-10 lg:items-start">
          {/* ── IMAGE COLUMN ────────────────────────────────────────── */}
          <div className="relative">
            <div className="relative bg-[var(--color-bg-surface)] rounded-[2rem] overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-card)] aspect-square flex items-center justify-center p-8 group">
              {produto.fotoUrl ? (
                <img
                  src={produto.fotoUrl}
                  alt={produto.nome}
                  onLoad={() => setImgLoaded(true)}
                  className={`
                    max-w-full max-h-full object-contain
                    transition-transform duration-500 group-hover:scale-105
                    ${imgLoaded ? "opacity-100" : "opacity-0"}
                  `}
                />
              ) : (
                <span
                  className="text-[8rem] select-none transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
                >
                  🌱
                </span>
              )}

              {/* Floating badges */}
              <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
                {produto.certificados.length > 0 && (
                  <span className="badge-eco text-[11px] py-1 px-3 backdrop-blur-md bg-[rgba(209,250,229,0.92)] text-[#065f46] border border-[#a7f3d0] font-bold uppercase tracking-wide shadow-sm">
                    ✦ Certificado
                  </span>
                )}
                <span className="badge-eco text-[11px] py-1 px-3 backdrop-blur-md bg-[rgba(224,242,254,0.92)] text-[#075985] border border-[#bae6fd] font-bold uppercase tracking-wide shadow-sm">
                  🌿 Eco-Friendly
                </span>
              </div>
            </div>
          </div>

          {/* ── INFO COLUMN ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Category + Title */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                {produto.categoria.nome}
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight">
                {produto.nome}
              </h1>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1 font-medium">
                por{" "}
                <span className="text-[var(--color-text-secondary)]">
                  {produto.marca.nome}
                </span>
              </p>
            </div>

            {/* Stars (decorative) */}
            <div className="flex items-center gap-2">
              <span className="text-[#f59e0b] text-base tracking-tight">
                ★★★★★
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                (produto verificado)
              </span>
            </div>

            {/* Pricing */}
            <div className="py-5 border-t border-b border-[var(--color-border)]">
              <p className="font-display text-4xl font-extrabold text-[var(--color-text-primary)] leading-none mb-1">
                {precoFormatado}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                em até{" "}
                <strong className="text-[var(--color-text-primary)]">
                  {parcelas}x de {valorParcela}
                </strong>{" "}
                sem juros
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <button
                className="
                  w-full py-4 rounded-full font-bold text-base text-white
                  bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                  flex items-center justify-center gap-3
                  shadow-[var(--shadow-btn)]
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)]
                  active:translate-y-0
                "
              >
                <span>Comprar na Loja Parceira</span>
                <span className="text-sm opacity-80">↗</span>
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 text-xs text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <span className="text-[var(--color-primary)]">✓</span> Produto
                  Verificado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[var(--color-primary)]">🔒</span> Compra
                  Segura
                </span>
              </div>
            </div>

            {/* Impact Card */}
            <ImpactCard preco={produto.preco} />
          </div>
        </section>

        {/* ── TABS SECTION ──────────────────────────────────────────── */}
        <section
          className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[1.5rem] overflow-hidden shadow-[var(--shadow-card)]"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition:
              "opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.2,1,0.3,1) 0.15s",
          }}
        >
          <Tabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasCerts={hasCerts}
          />

          <div className="p-6 md:p-10">
            {/* ── SOBRE ─────────────────────────────────────────────── */}
            {activeTab === "sobre" && (
              <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                {produto.descricao ? (
                  <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-secondary)] mb-8">
                    {produto.descricao}
                  </p>
                ) : (
                  <p className="text-[var(--color-text-tertiary)] italic mb-8">
                    Descrição não disponível.
                  </p>
                )}

                <div>
                  <h4 className="font-display font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <span className="text-[var(--color-primary)]">★</span>{" "}
                    Destaques
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {[
                      "Produção ética e responsável",
                      "Material reciclável e sustentável",
                      "Sem componentes prejudiciais ao meio ambiente",
                      `Categoria: ${produto.categoria.nome}`,
                      `Marca: ${produto.marca.nome}`,
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-[var(--color-text-secondary)] text-sm"
                      >
                        <span className="text-[var(--color-primary)] mt-0.5 text-xs flex-shrink-0">
                          ✦
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── SPECS ─────────────────────────────────────────────── */}
            {activeTab === "specs" && (
              <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      ["Nome", produto.nome],
                      ["Categoria", produto.categoria.nome],
                      ["Marca", produto.marca.nome],
                      ...(produto.categoria.descricao
                        ? [["Sobre a Categoria", produto.categoria.descricao]]
                        : []),
                      ...(produto.marca.descricao
                        ? [["Sobre a Marca", produto.marca.descricao]]
                        : []),
                      ["Preço", precoFormatado],
                      [
                        "Adicionado em",
                        new Date(produto.criadoEm).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      ],
                    ].map(([key, val], i) => (
                      <tr
                        key={key}
                        className="border-b border-[var(--color-border)] last:border-none"
                      >
                        <td className="py-4 pr-6 font-semibold text-sm text-[var(--color-text-primary)] w-[35%] bg-[var(--color-bg-body)] px-4 first:rounded-tl-xl last:rounded-bl-xl">
                          {key}
                        </td>
                        <td className="py-4 px-4 text-sm text-[var(--color-text-secondary)]">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CERTIFICADOS ─────────────────────────────────────── */}
            {activeTab === "certificados" && hasCerts && (
              <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                <div className="mb-6">
                  <h4 className="font-display font-bold text-[var(--color-text-primary)] text-lg mb-1">
                    Certificações & Selos
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Este produto possui {produto.certificados.length}{" "}
                    certificado
                    {produto.certificados.length > 1 ? "s" : ""} de
                    sustentabilidade reconhecido
                    {produto.certificados.length > 1 ? "s" : ""}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {produto.certificados.map(({ certificado }) => (
                    <CertBadge key={certificado.id} cert={certificado} />
                  ))}
                </div>

                <div className="mt-6 p-5 rounded-2xl border border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)]">
                  <p className="text-sm text-[var(--color-primary-dark)] leading-relaxed font-medium">
                    🌿 Todos os certificados são verificados e emitidos por
                    órgãos reconhecidos internacionalmente. Eles garantem que
                    este produto atende a padrões rigorosos de sustentabilidade
                    e responsabilidade ambiental.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
