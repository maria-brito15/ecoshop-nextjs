// app/page.tsx

/**
 * HOME PAGE
 *
 * Route: "/"
 *
 * This is EcoShop's main page, responsible for introducing the
 * platform to new visitors and users.
 *
 * Features:
 * - Hero section with a call-to-action
 * - Listing of the first 4 products (highlights)
 * - Display of the available categories
 * - Informational banner about EcoScan AI
 * - Testimonials and impact metrics
 *
 * Loading states:
 * - Skeleton loading while fetching products/categories
 * - Friendly message on error
 *
 * @see lib/hooks/useProducts.ts - Hook to list products
 * @see lib/hooks/useCategories.ts - Hook to list categories
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useListProducts } from "@/lib/hooks/useProducts";
import { useListCategories } from "@/lib/hooks/useCategories";
import type { Product, Category } from "@/types/api";

// ----------------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------------

/**
 * Returns a representative icon based on the category name.
 * Used to make navigation more visual.
 *
 * @param name - Category name (e.g. "Home and Decor")
 * @returns Emoji matching the category
 */
function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("home")) return "🏠";
  if (n.includes("cosmetic") || n.includes("beauty") || n.includes("body")) return "🌿";
  if (n.includes("cloth") || n.includes("fashion") || n.includes("footwear")) return "👕";
  if (n.includes("pet")) return "🐾";
  return "🍃";
}

/**
 * Custom hook for the reveal-on-scroll animation.
 * Adds the "visible" class to elements with the "animate-on-scroll" class
 * when they enter the viewport.
 */
function useScrollReveal() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 },
      );

      const elements = document.querySelectorAll(".animate-on-scroll");
      elements.forEach((el) => {
        observer.observe(el);
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);
}

/**
 * Product card shown in the home grid.
 * Simplified version of the ProductCard used in /products.
 *
 * @param product - Data of the product to display
 */
function ProductCard({ product }: { product: Product }) {
  const formattedPrice = Number(product.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <article className="product-card animate-on-scroll cursor-pointer visible">
      <div className="h-48 flex items-center justify-center bg-[var(--color-bg-body)] relative overflow-hidden">
        {product.photoUrl ? (
          <img
            src={product.photoUrl}
            alt={product.name}
            className="card-img w-full h-full object-cover"
          />
        ) : (
          <span className="card-img text-6xl select-none">🌱</span>
        )}
        <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
          {product.category?.name}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {product.brand?.name}
        </span>
        <h3 className="font-bold text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {product.name}
        </h3>
        <Link
          href={`/products/${product.id}`}
          className="mt-auto pt-3 text-lg font-extrabold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          {formattedPrice}
        </Link>
      </div>
    </article>
  );
}

/**
 * Category card shown in the home grid.
 * On click, redirects to the product listing with a filter.
 *
 * @param category - Category data
 */
function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="
        animate-on-scroll group w-full visible
        flex flex-col items-center gap-3
        p-6 rounded-[var(--radius-card)] text-center
        bg-[var(--color-bg-surface)]
        border border-[var(--color-border)]
        hover:border-[var(--color-primary)]
        hover:-translate-y-1
        hover:shadow-[var(--shadow-card)]
        transition-all duration-300
      "
    >
      <span
        className="
          text-3xl w-14 h-14
          flex items-center justify-center rounded-full
          bg-[var(--color-primary-light)]
          group-hover:bg-[var(--color-primary)]
          transition-colors
        "
      >
        {categoryIcon(category.name)}
      </span>
      <span className="font-bold text-[var(--color-text-primary)]">
        {category.name}
      </span>
    </Link>
  );
}

// ----------------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------------

export default function HomePage() {
  // Fetch the first 4 products to show as highlights
  const {
    data: productsData,
    loading: loadingProducts,
    error: productsError,
  } = useListProducts(1, 4);

  // Fetch all categories to show in the grid
  const { data: categoriesData, loading: loadingCategories } =
    useListCategories();

  const products = productsData?.products ?? [];
  const categories = categoriesData?.categories ?? [];
  const loading = loadingProducts || loadingCategories;

  useScrollReveal();

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      {/* --------------------------------------------------------------------
        SECTION 1: HERO SECTION
        Main presentation of the platform with a CTA
      -------------------------------------------------------------------- */}
      <section
        className="
          py-20 md:py-32 bg-[var(--color-bg-body)]
          [background-image:radial-gradient(circle_at_10%_10%,rgba(45,149,105,0.05)_0%,transparent_25%),radial-gradient(circle_at_90%_90%,rgba(45,149,105,0.04)_0%,transparent_25%)]
        "
      >
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <span className="badge-eco w-fit">🌿 Compras conscientes</span>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
                Your choice{" "}
                <span className="text-gradient-eco">makes a difference</span>
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)] max-w-lg">
                Discover sustainable products that care for you and the planet, with fast delivery and real purpose.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/products" className="btn-primary">
                  Explore Products
                </Link>
                <Link href="/education" className="btn-secondary">
                  Learn more
                </Link>
              </div>

              {/* Impact metrics */}
              <div className="flex gap-8 pt-6 border-t border-[var(--color-border)]">
                {[
                  { value: "2k+", label: "Eco products" },
                  { value: "98%", label: "Satisfaction" },
                  { value: "0 CO₂", label: "Carbon-neutral deliveries" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <strong className="text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
                      {s.value}
                    </strong>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] italic pt-1">
                Illustrative numbers — no real data source yet (REQ-CONT-02).
              </p>
            </div>

            {/* Image/illustration on the right side */}
            <div className="hidden lg:flex items-center justify-center h-96 rounded-3xl overflow-hidden relative bg-[var(--color-primary-light)] border border-[var(--color-border)]">
              <img
                src="/banner.png"
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-2xl border border-[var(--color-border)]">
                ✅ Eco-Friendly Certificate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
        SECTION 2: FEATURED PRODUCTS
        Grid with the first 4 products of the catalog
      -------------------------------------------------------------------- */}
      <section id="products" className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
              Highlights
            </span>
            <h2 className="font-display text-4xl font-extrabold mb-3">
              Best Products
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Carefully selected for you and for the planet.
            </p>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-[var(--radius-card)] bg-[var(--color-bg-body)] animate-pulse"
                />
              ))}
            </div>
          ) : productsError ? (
            /* Error state */
            <div className="text-center py-12">
              <p className="text-[var(--color-error)] font-semibold mb-2">
                Oops! Something went wrong.
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">
                {productsError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-[var(--color-primary)] hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          ) : products.length > 0 ? (
            /* Product grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--color-text-tertiary)] py-12">
              No products found.
            </p>
          )}

          <div className="text-center mt-10">
            <Link href="/products" className="btn-secondary">
              See all products →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
        SECTION 3: CATEGORIES
        Grid with the main catalog categories
      -------------------------------------------------------------------- */}
      {categories.length > 0 && (
        <section className="py-20 bg-[var(--color-bg-body)]">
          <div className="container-eco">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="block text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                Browse by
              </span>
              <h2 className="font-display text-4xl font-extrabold">
                Categories
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 justify-items-center mx-auto max-w-5xl">
              {categories.slice(0, 6).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------------
        SECTION 4: EDUCATION CENTER
        Call-to-action for the environmental education section
      -------------------------------------------------------------------- */}
      <section className="py-20 bg-[linear-gradient(135deg,#1a3a2e_0%,#0f2419_100%)] text-white">
        <div className="container-eco">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-on-scroll flex flex-col gap-6 visible">
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                Conhecimento
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
                Centro Educativo EcoShop
              </h2>
              <p className="text-[#a5c3b6] text-lg">
                Access our guides and learn how your small actions transform the world.
              </p>
              {[
                {
                  icon: "📖",
                  title: "Practical Guides",
                  desc: "Learn how to reduce your household waste.",
                },
                {
                  icon: "🌱",
                  title: "Sustainability",
                  desc: "Understand the real impact of each material.",
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 items-start">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <h4 className="font-bold text-white">{f.title}</h4>
                    <p className="text-sm text-[#a5c3b6]">{f.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="/education" className="btn-primary w-fit mt-2">
                Go to Educational Content
              </Link>
            </div>
            <div className="animate-on-scroll hidden lg:flex items-center justify-center h-80 rounded-3xl text-9xl bg-white/5 border border-white/10 visible">
              📚
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
        SECTION 5: ECOSCAN AI
        Promotional banner for the AI feature
      -------------------------------------------------------------------- */}
      <section className="py-20 bg-[var(--color-bg-surface)]">
        <div className="container-eco">
          <div className="animate-on-scroll flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-3xl bg-[var(--color-primary)] relative overflow-hidden visible">
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_80%_50%,white_0%,transparent_60%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3 text-white">
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                Artificial Intelligence
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">
                EcoScan IA
              </h2>
              <p className="text-white/80 max-w-md">
                Use our AI to identify waste and find the right way to dispose of it.
              </p>
            </div>
            <Link
              href="/ai-scan"
              className="relative z-10 flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-primary-dark)] font-bold rounded-full hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              🔍 Try It Now
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
        FOOTER
        Footer with institutional links and social networks
      -------------------------------------------------------------------- */}
      <footer className="bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-16">
        <div className="container-eco">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="font-display text-2xl font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
                🍃 EcoShop
              </span>
              <p className="text-[var(--color-text-secondary)] max-w-sm">
                We connect people to sustainable products, making conscious choices easier.
              </p>
              <div className="flex gap-3">
                {["Instagram", "Twitter", "YouTube"].map((r) => (
                  <a
                    key={r}
                    href="#"
                    aria-label={r}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-sm bg-[var(--color-bg-body)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                  >
                    {r[0]}
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Shop",
                links: [
                  { label: "Products", href: "/products" },
                  { label: "Categories", href: "/products" },
                  { label: "Novidades", href: "/products" },
                ],
              },
              {
                title: "Empresa",
                links: [
                  { label: "About us", href: "/about" },
                  { label: "Education", href: "/education" },
                  { label: "EcoScan IA", href: "/ai-scan" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-bold text-[var(--color-text-primary)] mb-4">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:pl-1 transition-all"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[var(--color-text-tertiary)]">
            <span>
              © {new Date().getFullYear()} EcoShop. All rights reserved.
            </span>
            <span className="flex gap-2 text-xl opacity-60">💳 🔒 ♻️</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
