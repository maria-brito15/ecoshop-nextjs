// app/(store)/produtos/page.tsx

/**
 * ============================================================================
 * PÁGINA DE LISTAGEM DE PRODUTOS
 * ============================================================================
 * Rota: "/produtos"
 *
 * Página principal do catálogo de produtos do EcoShop.
 * Permite que usuários naveguem, filtrem e busquem produtos sustentáveis.
 *
 * Funcionalidades:
 * - Listagem paginada de produtos (12 por página)
 * - Filtros: categoria, faixa de preço, busca textual
 * - Ordenação: relevância, preço (crescente/decrescente), nome (A-Z/Z-A)
 * - Layout responsivo com sidebar (desktop) e menu lateral (mobile)
 * - Skeletons durante carregamento
 * - Lazy loading com Intersection Observer
 *
 * @see lib/hooks/useProducts.ts - Hook useListarProdutos
 * @see lib/hooks/useCategories.ts - Hook useListarCategorias
 * ============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useListProducts, type ProductOrder } from "@/lib/hooks/useProducts";
import { useListCategories } from "@/lib/hooks/useCategories";
import { useListBrands } from "@/lib/hooks/useBrands";
import type { Produto, ProdutoCertificado } from "@/types/api";

// ----------------------------------------------------------------------------
// COMPONENTE: SKELETON CARD
// ----------------------------------------------------------------------------
// Exibido durante o carregamento dos produtos. Mantém a mesma estrutura
// do ProductCard para evitar layout shift (CLS).

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

// ----------------------------------------------------------------------------
// COMPONENTE: PRODUCT CARD
// ----------------------------------------------------------------------------
// Card individual de produto com lazy loading via Intersection Observer.
// A animação de entrada só ocorre quando o card entra na viewport.

function ProductCard({ produto: product, index }: { produto: Produto; index: number }) {
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

  const formattedPrice = Number(product.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Delay escalonado para cada card (0ms, 80ms, 160ms...)
  const delay = Math.min(index % 6, 5) * 80;
  const categoryName = product.categoria?.nome ?? "Category";
  const brandName = product.marca?.nome ?? "Brand";

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
        href={`/produtos/${product.id}`}
        className="group block rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-surface)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[var(--shadow-xl)] hover:border-[var(--color-primary)] h-full flex flex-col"
      >
        {/* Área da imagem */}
        <div className="relative h-56 bg-[var(--color-bg-body)] flex items-center justify-center overflow-hidden">
          {product.fotoUrl ? (
            <Image
              src={product.fotoUrl}
              alt={product.nome}
              fill
              className="card-img object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <span
              className="card-img text-6xl select-none"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}
            >
              🌱
            </span>
          )}

          {/* Badge da categoria */}
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
            {categoryName}
          </span>

          {/* Overlay com "Ver detalhes" que aparece no hover */}
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

        {/* Conteúdo textual do card */}
        <div className="p-5 flex flex-col gap-2 flex-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {brandName}
          </span>

          <h3
            className={`
              font-display font-bold text-[var(--color-text-primary)]
              leading-snug line-clamp-2
              group-hover:text-[var(--color-primary)]
              transition-colors duration-200
            `}
          >
            {product.nome}
          </h3>

          {/* Descrição (limitada a 2 linhas) */}
          {product.descricao && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {product.descricao}
            </p>
          )}

          {/* Certificados do produto (máximo 2) */}
          {product.certificados && product.certificados.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.certificados
                .slice(0, 2)
                .map(({ certificado: certificate }: ProdutoCertificado) => (
                  <span
                    key={certificate.id}
                    className={`
                      text-[10px] font-bold px-2 py-0.5 rounded-full
                      bg-[var(--color-primary-light)]
                      text-[var(--color-primary)]
                      border border-[var(--color-primary)]/20
                    `}
                  >
                    ✓ {certificate.nome}
                  </span>
                ))}
            </div>
          )}

          {/* Preço e selo Eco */}
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
              {formattedPrice}
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

// ----------------------------------------------------------------------------
// PÁGINA PRINCIPAL
// ----------------------------------------------------------------------------

export default function ProductsPage() {
  // Estados de paginação e filtros
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [brandId, setBrandId] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceInput, setPriceInput] = useState(1000);
  const [sortBy, setSortBy] = useState<ProductOrder>("relevancia");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Hooks de dados — ordenação, marca e preço máximo são aplicados pelo
  // servidor ao catálogo inteiro, não só à página atual (REQ-CAT-06/07).
  const { data, loading: loading, error: error } = useListProducts(page, 12, categoryId, search, {
    marcaId: brandId,
    precoMax: maxPrice < 1000 ? maxPrice : undefined,
    sort: sortBy,
  });
  const { data: catData } = useListCategories();
  const { data: brandsData } = useListBrands();

  const products = data?.produtos ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);
  const categories = catData?.categorias ?? [];
  const brands = (brandsData?.marcas ?? []).filter(
    (m) => m.status === "APROVADA",
  );

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(name);
  }

  // Debounce no filtro de preço para evitar re-renders excessivos
  function handlePriceChange(val: number) {
    setPriceInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setMaxPrice(val);
      setPage(1);
    }, 300);
  }

  function clearFilters() {
    setName("");
    setSearch("");
    setCategoryId(undefined);
    setBrandId(undefined);
    setMaxPrice(1000);
    setPriceInput(1000);
    setSortBy("relevancia");
    setPage(1);
  }

  const pricePercent = ((priceInput / 1000) * 100).toFixed(1);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* HEADER DA PÁGINA COM BREADCRUMB */}
      <div
        className={`
          border-b border-[var(--color-border)]
          bg-[var(--color-bg-surface)]
          py-8
        `}
      >
        <div className="container-eco">
          {/* Breadcrumb de navegação */}
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

          {/* Título e contador */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)]">
                Produtos <span className="text-gradient-eco">Sustentáveis</span>
              </h1>
              {!loading && (
                <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                  {total > 0 ? (
                    <>
                      <span className="font-bold text-[var(--color-primary)]">
                        {total}
                      </span>{" "}
                      produto{total !== 1 ? "s" : ""}{" "}
                      encontrado{total !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "Nenhum produto encontrado"
                  )}
                </p>
              )}
            </div>

            {/* Barra de busca */}
            <form
              onSubmit={handleSearch}
              className="flex gap-2 w-full sm:w-auto sm:min-w-[320px]"
            >
              <input
                type="text"
                placeholder="Buscar produto..."
                value={name}
                onChange={(e) => setName(e.target.value)}
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

      {/* CONTEÚDO PRINCIPAL COM SIDEBAR */}
      <div className="container-eco py-8">
        <div className="flex gap-8 items-start">
          {/* ================================================================ */}
          {/* SIDEBAR DESKTOP */}
          {/* ================================================================ */}
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
            {/* Header do sidebar com botão limpar */}
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
                onClick={clearFilters}
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

            {/* Filtro por categorias */}
            <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3 flex items-center gap-2">
                <span>🏷</span> Categorias
              </p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    onClick={() => {
                      setCategoryId(undefined);
                      setPage(1);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 flex items-center justify-between
                      ${
                        categoryId === undefined
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                      }
                    `}
                  >
                    <span>Todas</span>
                    {categoryId === undefined && (
                      <span className="text-xs">✓</span>
                    )}
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setCategoryId(cat.id);
                        setPage(1);
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150 flex items-center justify-between
                        ${
                          categoryId === cat.id
                            ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                        }
                      `}
                    >
                      <span>{cat.nome}</span>
                      {categoryId === cat.id && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Filtro por marca */}
            {brands.length > 0 && (
              <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3 flex items-center gap-2">
                  <span>🤝</span> Marcas
                </p>
                <ul className="flex flex-col gap-0.5">
                  <li>
                    <button
                      onClick={() => {
                        setBrandId(undefined);
                        setPage(1);
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150 flex items-center justify-between
                        ${
                          brandId === undefined
                            ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                        }
                      `}
                    >
                      <span>Todas</span>
                      {brandId === undefined && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  </li>
                  {brands.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          setBrandId(m.id);
                          setPage(1);
                        }}
                        className={`
                          w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-150 flex items-center justify-between
                          ${
                            brandId === m.id
                              ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]"
                          }
                        `}
                      >
                        <span>{m.nome}</span>
                        {brandId === m.id && <span className="text-xs">✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Filtro por faixa de preço (slider) */}
            <div className="px-4 py-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4 flex items-center gap-2">
                <span>💰</span> Faixa de Preço
              </p>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={priceInput}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
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
                  R$ {priceInput.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Botão limpar (mobile) */}
            <div className="px-4 py-4">
              <button
                onClick={clearFilters}
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

          {/* ================================================================ */}
          {/* ÁREA DE LISTAGEM DOS PRODUTOS */}
          {/* ================================================================ */}
          <div className="flex-1 min-w-0">
            {/* Barra de ordenação e filtro mobile */}
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
                {/* Botão para abrir sidebar no mobile */}
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
                  {(categoryId !== undefined ||
                    brandId !== undefined ||
                    maxPrice < 1000) && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>

                {/* Contador de resultados */}
                <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span className="text-[var(--color-primary)]">📦</span>
                  {loading ? (
                    "Carregando..."
                  ) : (
                    <>
                      <span className="font-extrabold text-[var(--color-primary)]">
                        {total}
                      </span>{" "}
                      produto{total !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
              </div>

              {/* Seletor de ordenação */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[var(--color-text-secondary)] whitespace-nowrap hidden sm:block">
                  Ordenar por:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as ProductOrder);
                    setPage(1);
                  }}
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

            {/* Estado de erro */}
            {error && (
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
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Skeletons (loading) */}
            {loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Nenhum produto encontrado */}
            {!loading && !error && products.length === 0 && (
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
                <button onClick={clearFilters} className="btn-primary">
                  🔄 Limpar Filtros
                </button>
              </div>
            )}

            {/* Grid de produtos */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product, i) => (
                  <ProductCard key={product.id} produto={product} index={i} />
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && !loading && (
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
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                  {totalPages > 5 && (
                    <span className="text-[var(--color-text-tertiary)] px-2">
                      …
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
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

      {/* ================================================================ */}
      {/* SIDEBAR MOBILE (OVERLAY) */}
      {/* ================================================================ */}
      {sidebarOpen && (
        <>
          {/* Backdrop escuro */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          {/* Menu lateral */}
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
            {/* Header do mobile */}
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

            {/* Filtros (versão mobile) */}
            <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                🏷 Categorias
              </p>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <button
                    onClick={() => {
                      setCategoryId(undefined);
                      setPage(1);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${categoryId === undefined ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                  >
                    Todas
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setCategoryId(cat.id);
                        setPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${categoryId === cat.id ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                    >
                      {cat.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Filtro por marca (mobile) */}
            {brands.length > 0 && (
              <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                  🤝 Marcas
                </p>
                <ul className="flex flex-col gap-0.5">
                  <li>
                    <button
                      onClick={() => {
                        setBrandId(undefined);
                        setPage(1);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${brandId === undefined ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                    >
                      Todas
                    </button>
                  </li>
                  {brands.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          setBrandId(m.id);
                          setPage(1);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${brandId === m.id ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold" : "text-[var(--color-text-secondary)]"}`}
                      >
                        {m.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Slider de preço (mobile) */}
            <div className="px-4 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4">
                💰 Faixa de Preço
              </p>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={priceInput}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
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
                  R$ {priceInput.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Botão limpar (mobile) */}
            <div className="px-4 py-4 mt-auto border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  clearFilters();
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

      {/* Estilos para animação do slide-in no mobile */}
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
