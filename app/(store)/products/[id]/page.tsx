// app/(store)/products/[id]/page.tsx

/**
 * PRODUCT DETAIL PAGE
 *
 * Route: "/products/[id]"
 *
 * Full detail page for a specific product.
 * Shows all available information about the product.
 *
 * Features:
 * - Main product image (fallback to an icon)
 * - Price and installment options
 * - Detailed description
 * - Technical sheet (specifications)
 * - Sustainability certificates
 * - Environmental impact metrics (estimates)
 * - Tabs organizing the content
 *
 * Loading states:
 * - Skeleton during the fetch
 * - Friendly message if the product is not found
 *
 * @see lib/hooks/useProducts.ts - useGetProduct hook
 */

"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useGetProduct } from "@/lib/hooks/useProducts";
import { useListPhotos } from "@/lib/hooks/usePhotos";
import type { Certificate } from "@/types/api";

type Props = {
  params: Promise<{ id: string }>;
};

type Tab = "about" | "specs" | "certificates";

/**
 * Item of the local visited-products history (REQ-PERF-05).
 * Same shape read by app/(profile)/profile/page.tsx under the key "ecoshop_history".
 */
type HistoryItem = {
  productId: number;
  name: string;
  photoUrl?: string;
  price: number;
  visitedAt: string;
};

// ----------------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------------

/**
 * Skeleton shown while the product data loads.
 */
function SkeletonDetail() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-body)]">
      <div className="container-eco py-6">
        <div className="h-5 w-36 bg-[var(--color-bg-surface)] rounded-full animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12">
          <div className="aspect-square bg-[var(--color-bg-surface)] rounded-[2rem] animate-pulse border border-[var(--color-border)]" />
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

/**
 * Badge for an individual certificate.
 */
function CertBadge({ cert }: { cert: Certificate }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-body)] transition-all hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-primary)] text-base">✦</span>
        <span className="font-bold text-sm text-[var(--color-text-primary)] font-display">
          {cert.name}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)] pl-6">
        {cert.issuingBody}
      </span>
      {cert.description && (
        <p className="text-xs text-[var(--color-text-secondary)] pl-6 leading-relaxed mt-0.5">
          {cert.description}
        </p>
      )}
    </div>
  );
}

/**
 * Environmental impact card (estimates based on the product price).
 */
function ImpactCard({ price }: { price: number }) {
  const val = Number(price);
  const co2 = (val * 0.012).toFixed(1) + "kg";
  const water = Math.round(val * 0.8) + "L";
  const trees = val > 200 ? "2" : "1";

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-4 text-[var(--color-primary)] font-bold text-sm font-display uppercase tracking-wide">
        <span>🌍</span>
        <span>Positive Impact</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: co2, label: "CO₂ Evitado" },
          { value: water, label: "Water Saved" },
          { value: trees, label: "Trees" },
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
      <p className="text-[10px] text-[var(--color-text-tertiary)] italic mt-3">
        Illustrative estimate calculated from the price — there is no real data source per product yet (REQ-CONT-05).
      </p>
    </div>
  );
}

/**
 * Navigation tabs between About, Technical Sheet and Certificates.
 */
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
    { id: "about", label: "About the Product" },
    { id: "specs", label: "Technical Sheet" },
    ...(hasCerts ? [{ id: "certificates" as Tab, label: "Certificates" }] : []),
  ];

  return (
    <nav className="flex border-b border-[var(--color-border)] overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === t.id ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-bg-surface)]" : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-surface-hover)]"}`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ----------------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------------

export default function ProductPage({ params }: Props) {
  const { id } = use(params);
  const { data, loading, error } = useGetProduct(Number(id));
  const { data: photosData } = useListPhotos(Number(id));
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Record the visit in the local history (REQ-PERF-05): the History tab of the
  // profile (app/(profile)/profile/page.tsx) reads the same key. No backend
  // because the history is per browser, not per account (ADR-0004).
  useEffect(() => {
    const product = data?.product;
    if (!product) return;
    try {
      const raw = localStorage.getItem("ecoshop_history");
      const history: HistoryItem[] = raw ? JSON.parse(raw) : [];
      const withoutDuplicate = history.filter((h) => h.productId !== product.id);
      const updated = [
        {
          productId: product.id,
          name: product.name,
          photoUrl: product.photoUrl,
          price: Number(product.price),
          visitedAt: new Date().toISOString(),
        },
        ...withoutDuplicate,
      ].slice(0, 50);
      localStorage.setItem("ecoshop_history", JSON.stringify(updated));
    } catch {
      // localStorage unavailable (e.g. private mode); history is not critical
    }
  }, [data?.product]);

  // Loading state
  if (loading) return <SkeletonDetail />;

  // Product not found
  if (error) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-body)] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Product not found
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <Link href="/products" className="btn-primary">
            ← Back to products
          </Link>
        </div>
      </main>
    );
  }

  if (!data?.product) return null;

  const product = data.product;
  const categoryName = product.category?.name ?? "Category";
  const categoryDescription = product.category?.description;
  const brandName = product.brand?.name ?? "Brand";
  const brandDescription = product.brand?.description;
  const numericPrice = Number(product.price);
  const formattedPrice = numericPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const installments = 12;
  const installmentValue = (numericPrice / installments).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const hasCerts = !!(product.certificates && product.certificates.length > 0);
  const photos = photosData?.photos ?? [];
  const mainImage =
    selectedPhoto ?? product.photoUrl ?? photos[0]?.url ?? null;

  return (
    <main className="min-h-screen bg-[var(--color-bg-body)] pb-20">
      {/* BREADCRUMB */}
      <div className="container-eco pt-6 pb-2">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <span
            className="transition-transform group-hover:-translate-x-1 inline-block"
            aria-hidden
          >
            ←
          </span>
          Back to products
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="container-eco"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(28px)",
          transition:
            "opacity 0.7s ease, transform 0.7s cubic-bezier(0.2,1,0.3,1)",
        }}
      >
        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 mt-4 mb-10 lg:items-start">
          {/* PRODUCT IMAGE */}
          <div className="relative">
            <div className="relative bg-[var(--color-bg-surface)] rounded-[2rem] overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-card)] aspect-square flex items-center justify-center p-8 group">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  onLoad={() => setImgLoaded(true)}
                  className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
              ) : (
                <span
                  className="text-[8rem] select-none transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
                >
                  🌱
                </span>
              )}
              <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
                {hasCerts && (
                  <span className="badge-eco text-[11px] py-1 px-3 backdrop-blur-md bg-[rgba(209,250,229,0.92)] text-[#065f46] border border-[#a7f3d0] font-bold uppercase tracking-wide shadow-sm">
                    ✦ Certificate
                  </span>
                )}
                <span className="badge-eco text-[11px] py-1 px-3 backdrop-blur-md bg-[rgba(224,242,254,0.92)] text-[#075985] border border-[#bae6fd] font-bold uppercase tracking-wide shadow-sm">
                  🌿 Eco-Friendly
                </span>
              </div>
            </div>

            {/* PHOTO GALLERY (REQ-MIDIA-04) */}
            {photos.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                {photos.map((photo) => (
                  <button
                    key={photo.name}
                    type="button"
                    onClick={() => {
                      setImgLoaded(false);
                      setSelectedPhoto(photo.url);
                    }}
                    aria-label={`View photo ${photo.name}`}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      mainImage === photo.url
                        ? "border-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                {categoryName}
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1 font-medium">
                by{" "}
                <span className="text-[var(--color-text-secondary)]">
                  {brandName}
                </span>
              </p>
            </div>

            {/* Static rating */}
            <div className="flex items-center gap-2">
              <span className="text-[#f59e0b] text-base tracking-tight">
                ★★★★★
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                (verified product)
              </span>
            </div>

            {/* Price */}
            <div className="py-5 border-t border-b border-[var(--color-border)]">
              <p className="font-display text-4xl font-extrabold text-[var(--color-text-primary)] leading-none mb-1">
                {formattedPrice}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                up to{" "}
                <strong className="text-[var(--color-text-primary)]">
                  {installments}x of {installmentValue}
                </strong>{" "}
                interest-free
              </p>
            </div>

            {/* Buy button */}
            <div className="flex flex-col gap-3">
              <button className="w-full py-4 rounded-full font-bold text-base text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] flex items-center justify-center gap-3 shadow-[var(--shadow-btn)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(45,149,105,0.4)] active:translate-y-0">
                <span>Buy at the Partner Store</span>
                <span className="text-sm opacity-80">↗</span>
              </button>
              <div className="flex items-center justify-center gap-5 text-xs text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <span className="text-[var(--color-primary)]">✓</span> Verified Product
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[var(--color-primary)]">🔒</span> Compra
                  Segura
                </span>
              </div>
            </div>

            {/* Environmental impact */}
            <ImpactCard price={product.price} />
          </div>
        </section>

        {/* TABS WITH DETAILED CONTENT */}
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
            {/* TAB: ABOUT THE PRODUCT */}
            {activeTab === "about" && (
              <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                {product.description ? (
                  <p className="text-base md:text-lg leading-relaxed text-[var(--color-text-secondary)] mb-8">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-[var(--color-text-tertiary)] italic mb-8">
                    Description not available.
                  </p>
                )}
                <div>
                  <h4 className="font-display font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <span className="text-[var(--color-primary)]">★</span>{" "}
                    Highlights
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {[
                      "Ethical and responsible production",
                      "Recyclable and sustainable material",
                      "No components harmful to the environment",
                      `Category: ${categoryName}`,
                      `Brand: ${brandName}`,
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

            {/* TAB: TECHNICAL SHEET */}
            {activeTab === "specs" && (
              <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      ["Name", product.name],
                      ["Category", categoryName],
                      ["Brand", brandName],
                      ...(categoryDescription
                        ? [["About the Category", categoryDescription]]
                        : []),
                      ...(brandDescription
                        ? [["About the Brand", brandDescription]]
                        : []),
                      ["Price", formattedPrice],
                      [
                        "Added on",
                        new Date(product.createdAt).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      ],
                    ].map(([key, val]) => (
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

            {/* TAB: CERTIFICATES */}
            {activeTab === "certificates" &&
              hasCerts &&
              product.certificates && (
                <div className="animate-[fadeSlideUp_0.4s_ease_forwards]">
                  <div className="mb-6">
                    <h4 className="font-display font-bold text-[var(--color-text-primary)] text-lg mb-1">
                      Certifications & Seals
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      This product has {product.certificates.length}{" "}
                      recognized sustainability certificate
                      {product.certificates.length > 1 ? "s" : ""}.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.certificates.map(({ certificate }) => (
                      <CertBadge key={certificate.id} cert={certificate} />
                    ))}
                  </div>
                  <div className="mt-6 p-5 rounded-2xl border border-dashed border-[var(--color-primary)] bg-[var(--color-primary-light)]">
                    <p className="text-sm text-[var(--color-primary-dark)] leading-relaxed font-medium">
                      🌿 All certificates are verified and issued by internationally recognized bodies. They ensure that this product meets strict sustainability and environmental responsibility standards.
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
