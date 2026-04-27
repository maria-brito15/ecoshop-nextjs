// app/(store)/produtos/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useListarProdutos } from "@/lib/hooks/useProdutos";
import { useListarCategorias } from "@/lib/hooks/useCategorias";
import type { Produto } from "@/types/api";

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD (loading state)
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-surface)] animate-pulse">
      <div className="h-56 bg-[var(--color-bg-body)]" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-1/3 bg-[var(--color-bg-surface-hover)] rounded-full" />
        <div className="h-4 w-4/5 bg-[var(--color-bg-surface-hover)] rounded-full" />
        <div className="h-4 w-3/5 bg-[var(--color-bg-surface-hover)] rounded-full" />
        <div className="mt-2 flex justify-between items-center">
          <div className="h-6 w-1/3 bg-[var(--color-bg-surface-hover)] rounded-full" />
          <div className="h-8 w-1/3 bg-[var(--color-bg-surface-hover)] rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ produto, index }: { produto: Produto; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const precoFormatado = parseFloat(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const delay = Math.min(index % 6, 5) * 80;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.2,1,0.3,1) ${delay}ms`,
      }}
    >
      <Link
        href={`/produtos/${produto.id}`}
        className={`
          group block rounded-[var(--radius-card)] overflow-hidden
          border border-[var(--color-border)]
          bg-[var(--color-bg-surface)]
          transition-all duration-300 ease-out
          hover:-translate-y-2 hover:shadow-[var(--shadow-xl)]
          hover:border-[var(--color-primary)]
          h-full flex flex-col
        `}
      >
        {/* Image */}
        <div className="relative h-56 bg-[var(--color-bg-body)] flex items-center justify-center overflow-hidden">
          {produto.fotoUrl ? (
            <img
              src={produto.fotoUrl}
              alt={produto.nome}
              className="card-img w-full h-full object-cover"
            />
          ) : (
            <span
              className="card-img text-6xl select-none"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}
            >
              🌱
            </span>
          )}

          {/* Category badge */}
          <span
            className={`
              absolute top-3 left-3
              text-xs font-bold px-3 py-1.5 rounded-full
              bg-[var(--color-primary-light)]
              text-[var(--color-primary-dark)]
              backdrop-blur-sm
              border border-[var(--color-primary)]/20
            `}
          >
            {produto.categoria.nome}
          </span>

          {/* Hover overlay with "Ver detalhes" */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/10
              transition-all duration-300
            `}
          >
            <span
              className={`
                px-5 py-2 rounded-full font-bold text-sm
                bg-[var(--color-primary)] text-white
                shadow-[var(--shadow-btn)]
                translate-y-4 opacity-0
                group-hover:translate-y-0 group-hover:opacity-100
                transition-all duration-300
              `}
            >
              Ver detalhes →
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-2 flex-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {produto.marca.nome}
          </span>

          <h3
            className={`
              font-display font-bold text-[var(--color-text-primary)]
              leading-snug line-clamp-2
              group-hover:text-[var(--color-primary)]
              transition-colors duration-200
            `}
          >
            {produto.nome}
          </h3>

          {produto.descricao && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {produto.descricao}
            </p>
          )}

          {/* Certificados */}
          {produto.certificados.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {produto.certificados.slice(0, 2).map(({ certificado }) => (
                <span
                  key={certificado.id}
                  className={`
                    text-[10px] font-bold px-2 py-0.5 rounded-full
                    bg-[var(--color-primary-light)]
                    text-[var(--color-primary)]
                    border border-[var(--color-primary)]/20
                  `}
                >
                  ✓ {certificado.nome}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            className={`
              mt-auto pt-4
              flex items-center justify-between
              border-t border-[var(--color-border)]
            `}
          >
            <span
              className={`
                text-xl font-extrabold font-display
                text-[var(--color-primary)]
              `}
            >
              {precoFormatado}
            </span>

            <span
              className={`
                text-xs font-semibold text-[var(--color-text-tertiary)]
                flex items-center gap-1
              `}
            >
              <span>🌿</span> Eco
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProdutosPage() {
  const [page, setPage] = useState(1);
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [maxPreco, setMaxPreco] = useState(1000);
  const [precoInput, setPrecoInput] = useState(1000);
  const [sortBy, setSortBy] = useState("relevancia");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { data, carregando, erro } = useListarProdutos(
    page,
    12,
    categoriaId,
    busca,
  );
  const { data: catData } = useListarCategorias();

  const produtos = data?.produtos ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / 12);
  const categorias = catData?.categorias ?? [];

  // Sort produtos
  const produtosSorted = [...produtos].sort((a, b) => {
    if (sortBy === "preco_asc")
      return parseFloat(a.preco) - parseFloat(b.preco);
    if (sortBy === "preco_desc")
      return parseFloat(b.preco) - parseFloat(a.preco);
    if (sortBy === "nome_asc") return a.nome.localeCompare(b.nome);
    if (sortBy === "nome_desc") return b.nome.localeCompare(a.nome);
    return 0;
  });

  // Price filter client-side
  const produtosFiltrados = produtosSorted.filter(
    (p) => parseFloat(p.preco) <= maxPreco,
  );

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(nome);
  }

  function handlePrecoChange(val: number) {
    setPrecoInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setMaxPreco(val), 300);
  }

  function limparFiltros() {
    setNome("");
    setBusca("");
    setCategoriaId(undefined);
    setMaxPreco(1000);
    setPrecoInput(1000);
    setSortBy("relevancia");
    setPage(1);
  }

  const pricePercent = ((precoInput / 1000) * 100).toFixed(1);

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div
        className={`
          border-b border-[var(--color-border)]
          bg-[var(--color-bg-surface)]
          py-8
        `}
      >
        <div className="container-eco">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-5">
            <Link
              href="/"
              className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
            >
              🏠 Início
            </Link>
            <span className="text-[var(--color-border)]">›</span>
            <span className="font-semibold text-[var(--color-text-primary)]">
              Produtos
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)]">
                Produtos <span className="text-gradient-eco">Sustentáveis</span>
              </h1>
              {!carregando && (
                <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                  {total > 0 ? (
                    <>
                      <span className="font-bold text-[var(--color-primary)]">
                        {produtosFiltrados.length}
                      </span>{" "}
                      produto{produtosFiltrados.length !== 1 ? "s" : ""}{" "}
                      encontrado{produtosFiltrados.length !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "Nenhum produto encontrado"
                  )}
                </p>
              )}
            </div>

            {/* Search bar */}
            <form
              onSubmit={handleBuscar}
              className="flex gap-2 w-full sm:w-auto sm:min-w-[320px]"
            >
              <input
                type="text"
                placeholder="Buscar produto..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                  bg-[var(--color-bg-body)]
                  border border-[var(--color-border)]
                  text-[var(--color-text-primary)]
                  placeholder:text-[var(--color-text-tertiary)]
                  focus:outline-none focus:border-[var(--color-primary)]
                  focus:ring-2 focus:ring-[var(--color-primary)]/20
                  transition-all
                `}
              />
              <button
                type="submit"
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-bold
                  bg-[var(--color-primary)] text-white
                  hover:bg-[var(--color-primary-hover)]
                  hover:-translate-y-px
                  shadow-[var(--shadow-btn)]
                  transition-all
                `}
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── LAYOUT: SIDEBAR + GRID ───────────────────────────────────── */}
      <div className="container-eco py-8">
        <div className="flex gap-8 items-start">
          {/* ── SIDEBAR ────────────────────────────────────────────────── */}
          <aside
            className={`
              hidden lg:flex flex-col gap-0
              w-[270px] flex-shrink-0
              bg-[var(--color-bg-surface)]
              border border-[var(--color-border)]
              rounded-[var(--radius-card)]
              overflow-hidden
              sticky top-[calc(var(--spacing-header)+20px)]
              max-h-[calc(100vh-var(--spacing-header)-40px)]
              overflow-y-auto
            `}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border) transparent",
            }}
          >
            {/* Sidebar header */}
            <div
              className={`
                flex items-center justify-between
                px-5 py-4
                border-b border-[var(--color-border)]
                bg-[var(--color-bg-body)]
              `}
            >
              <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
                <span>⚙</span> Filtros
              </h2>
              <button
                onClick={limparFiltros}
                className={`
                  text-xs font-semibold text-[var(--color-text-tertiary)]
                  hover:text-[var(--color-error)] transition-colors
                  px-2 py-1 rounded-lg
                  hover:bg-red-50
                `}
              >
                Limpar
              </button>
            </div>

            {/* Categorias */}
            <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3 flex items-center gap-2">
                <span>🏷</span> Categorias
              </p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    onClick={() => {
                      setCategoriaId(undefined);
                      setPage(1);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 flex items-center justify-between
                      ${
                        categoriaId === undefined
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                      }
                    `}
                  >
                    <span>Todas</span>
                    {categoriaId === undefined && (
                      <span className="text-xs">✓</span>
                    )}
                  </button>
                </li>
                {categorias.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setCategoriaId(cat.id);
                        setPage(1);
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150 flex items-center justify-between
                        ${
                          categoriaId === cat.id
                            ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                        }
                      `}
                    >
                      <span>{cat.nome}</span>
                      {categoriaId === cat.id && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preço */}
            <div className="px-4 py-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4 flex items-center gap-2">
                <span>💰</span> Faixa de Preço
              </p>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={precoInput}
                onChange={(e) => handlePrecoChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pricePercent}%, var(--color-border) ${pricePercent}%, var(--color-border) 100%)`,
                }}
                className={`
                  w-full h-2 rounded-full outline-none cursor-pointer
                  appearance-none
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-[3px]
                  [&::-webkit-slider-thumb]:border-[var(--color-primary)]
                  [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(45,149,105,0.3)]
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                `}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                  Até
                </span>
                <span className="text-lg font-extrabold font-display text-[var(--color-primary)]">
                  R$ {precoInput.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Limpar botão */}
            <div className="px-4 py-4">
              <button
                onClick={limparFiltros}
                className={`
                  w-full py-3 rounded-xl text-sm font-bold
                  border-2 border-dashed border-[var(--color-border)]
                  text-[var(--color-text-tertiary)]
                  hover:border-[var(--color-error)] hover:text-[var(--color-error)]
                  hover:bg-red-50
                  transition-all uppercase tracking-wide
                `}
              >
                ✕ Limpar Filtros
              </button>
            </div>
          </aside>

          {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div
              className={`
                flex flex-col sm:flex-row sm:items-center justify-between gap-3
                mb-6 px-4 py-3
                bg-[var(--color-bg-surface)]
                border border-[var(--color-border)]
                rounded-[var(--radius-card)]
              `}
            >
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`
                    lg:hidden flex items-center gap-2
                    px-3 py-2 rounded-xl text-sm font-bold
                    border border-[var(--color-border)]
                    text-[var(--color-text-secondary)]
                    hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                    transition-all
                  `}
                >
                  ⚙ Filtros
                  {(categoriaId !== undefined || maxPreco < 1000) && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>

                <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="text-[var(--color-primary)]">📦</span>
                  {carregando ? (
                    "Carregando..."
                  ) : (
                    <>
                      <span className="font-extrabold text-[var(--color-primary)]">
                        {produtosFiltrados.length}
                      </span>{" "}
                      produto{produtosFiltrados.length !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[var(--color-text-secondary)] whitespace-nowrap hidden sm:block">
                  Ordenar por:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`
                    text-sm font-medium
                    px-3 py-2 rounded-xl
                    bg-[var(--color-bg-body)]
                    border border-[var(--color-border)]
                    text-[var(--color-text-primary)]
                    focus:outline-none focus:border-[var(--color-primary)]
                    cursor-pointer transition-all
                    appearance-none
                    pr-8
                  `}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235a7a6f' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  <option value="relevancia">Relevância</option>
                  <option value="preco_asc">Menor Preço</option>
                  <option value="preco_desc">Maior Preço</option>
                  <option value="nome_asc">Nome (A-Z)</option>
                  <option value="nome_desc">Nome (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {erro && (
              <div
                className={`
                  flex flex-col items-center justify-center
                  py-16 text-center
                  bg-[var(--color-bg-surface)]
                  border border-[var(--color-border)]
                  rounded-[var(--radius-card)]
                `}
              >
                <span className="text-5xl mb-4">⚠️</span>
                <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-2">
                  Ops! Algo deu errado.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {erro}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Loading skeletons */}
            {carregando && !erro && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!carregando && !erro && produtosFiltrados.length === 0 && (
              <div
                className={`
                  flex flex-col items-center justify-center
                  py-20 text-center
                  bg-[var(--color-bg-surface)]
                  border-2 border-dashed border-[var(--color-border)]
                  rounded-[var(--radius-card)]
                `}
              >
                <span className="text-6xl mb-4 opacity-40">🔍</span>
                <h3 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-sm">
                  Não encontramos produtos que correspondam aos filtros
                  aplicados.
                </p>
                <button onClick={limparFiltros} className="btn-primary">
                  🔄 Limpar Filtros
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!carregando && !erro && produtosFiltrados.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {produtosFiltrados.map((produto, i) => (
                  <ProductCard key={produto.id} produto={produto} index={i} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPaginas > 1 && !carregando && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                    border border-[var(--color-border)]
                    text-[var(--color-text-secondary)]
                    hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all
                  `}
                >
                  ← Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`
                          w-10 h-10 rounded-xl font-bold text-sm transition-all
                          ${
                            page === p
                              ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-btn)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]"
                          }
                        `}
                      >
                        {p}
                      </button>
                    );
                  })}
                  {totalPaginas > 5 && (
                    <span className="text-[var(--color-text-tertiary)] px-2">
                      …
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPaginas}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                    border border-[var(--color-border)]
                    text-[var(--color-text-secondary)]
                    hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all
                  `}
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <aside
            className={`
              fixed top-0 left-0 bottom-0 z-50 w-[300px]
              bg-[var(--color-bg-surface)]
              flex flex-col
              shadow-[var(--shadow-xl)]
              lg:hidden
              overflow-y-auto
            `}
            style={{ animation: "slideInLeft 0.3s ease" }}
          >
            <div
              className={`
                flex items-center justify-between
                px-5 py-4 border-b border-[var(--color-border)]
              `}
            >
              <h2 className="font-display font-bold text-sm uppercase tracking-wider">
                ⚙ Filtros
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`
                  w-8 h-8 flex items-center justify-center
                  rounded-full
                  hover:bg-[var(--color-bg-surface-hover)]
                  transition-colors text-[var(--color-text-secondary)]
                `}
              >
                ✕
              </button>
            </div>

            <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                🏷 Categorias
              </p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    onClick={() => {
                      setCategoriaId(undefined);
                      setPage(1);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${categoriaId === undefined ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                  >
                    Todas
                  </button>
                </li>
                {categorias.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setCategoriaId(cat.id);
                        setPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${categoriaId === cat.id ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                    >
                      {cat.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-4 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4">
                💰 Faixa de Preço
              </p>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={precoInput}
                onChange={(e) => handlePrecoChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pricePercent}%, var(--color-border) ${pricePercent}%, var(--color-border) 100%)`,
                }}
                className="w-full h-2 rounded-full outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--color-primary)]"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Até
                </span>
                <span className="text-lg font-extrabold font-display text-[var(--color-primary)]">
                  R$ {precoInput.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="px-4 py-4 mt-auto border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  limparFiltros();
                  setSidebarOpen(false);
                }}
                className="w-full py-3 rounded-xl text-sm font-bold border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-all uppercase tracking-wide"
              >
                ✕ Limpar Filtros
              </button>
            </div>
          </aside>
        </>
      )}

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
