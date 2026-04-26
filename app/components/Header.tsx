"use client";

/*
  TAILWIND v4 — NOTAS DESTE COMPONENTE
  ─────────────────────────────────────
  • Classes de componente (.main-header, .main-header.scrolled, .nav-link)
    estão definidas em globals.css no @layer components — usamos aqui
    como qualquer outra className.

  • Dark mode: adicionamos/removemos a classe "dark-mode" no <html>,
    exatamente como o darkmode.js original faz. Os tokens CSS do
    globals.css reagem automaticamente.

  • suppressHydrationWarning no layout.tsx evita o erro de hidratação
    causado pelo dark mode lendo localStorage no cliente.
*/

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Início", href: "/", page: "inicio" },
  { label: "Produtos", href: "/produtos", page: "produtos" },
  { label: "Educação", href: "/educacao", page: "educacao" },
  { label: "EcoScan IA", href: "/ia-scan", page: "ecoscan" },
] as const;

const STORAGE_KEY = "ecoShopTheme";

// ─────────────────────────────────────────────
// HOOK: efeito de fundo ao rolar
// ─────────────────────────────────────────────
function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    // checa o estado inicial (caso a página abra já rolada)
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return scrolled;
}

// ─────────────────────────────────────────────
// HOOK: dark mode (replica o darkmode.js original em React)
// ─────────────────────────────────────────────
function useDarkMode() {
  // Inicializa com false para evitar mismatch de hidratação SSR/cliente.
  // O useEffect abaixo sincroniza com o localStorage logo em seguida.
  const [isDark, setIsDark] = useState(false);

  // Sincroniza com localStorage na montagem (cliente apenas)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const shouldBeDark = saved === "true";
    setIsDark(shouldBeDark);
    applyDarkClass(shouldBeDark);
  }, []);

  // Aplica/remove a classe no <html> e persiste sempre que muda
  useEffect(() => {
    applyDarkClass(isDark);
    localStorage.setItem(STORAGE_KEY, String(isDark));
  }, [isDark]);

  function applyDarkClass(dark: boolean) {
    const html = document.documentElement;
    dark ? html.classList.add("dark-mode") : html.classList.remove("dark-mode");
  }

  // Sincroniza entre abas (igual ao darkmode.js original)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setIsDark(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Header() {
  const scrolled = useScrolled();
  const { isDark, toggle } = useDarkMode();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body enquanto o menu mobile estiver aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Verifica se o link está ativo (lida com sub-rotas)
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ═══════════════════════════════════════
          HEADER FIXO
          ═══════════════════════════════════════
          "main-header" e "main-header.scrolled" estão em globals.css.
          O backdrop-filter e o color-mix dependem dessas classes CSS —
          não têm equivalente direto no Tailwind v4, por isso ficam lá.
      */}
      <header className={`main-header ${scrolled ? "scrolled" : ""}`}>
        <div
          className="
            max-w-[1400px] mx-auto h-full
            px-6 md:px-10
            flex items-center justify-between gap-8
          "
        >
          {/* ── LOGO ── */}
          <Link
            href="/"
            className="
              flex items-center gap-3
              font-display text-xl font-extrabold
              text-[var(--color-text-primary)]
              hover:-translate-y-px transition-transform
            "
          >
            {/* Ícone folha SVG inline — sem dependência de Font Awesome */}
            <span
              className="
                w-9 h-9 flex items-center justify-center
                rounded-xl text-lg
                bg-[var(--color-primary-light)]
                text-[var(--color-primary)]
              "
            >
              🍃
            </span>
            {/*
              text-gradient-eco → @utility do globals.css
              Aplica o gradiente verde como clip de texto
            */}
            <span className="text-gradient-eco">EcoShop</span>
          </Link>

          {/* ── NAV CENTRAL (desktop) ──
              Oculto em mobile: hidden md:flex
          */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              /*
                nav-link → @layer components do globals.css
                Usamos className condicional para "active" —
                o CSS já lida com o estilo via &.active
              */
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ── LADO DIREITO ── */}
          <div className="flex items-center gap-3">
            {/* Botão entrar (CTA) — oculto em mobile pequeno */}
            <Link
              href="/sign-in"
              className="
                hidden sm:inline-flex items-center gap-2
                px-5 py-2.5
                bg-[var(--color-primary)]
                text-white font-semibold text-sm
                rounded-full
                shadow-[var(--shadow-btn)]
                hover:bg-[var(--color-primary-hover)]
                hover:-translate-y-px
                transition-all
              "
            >
              Entrar
            </Link>

            {/* Botão Dark Mode
                Quando isDark: mostra ☀️ (para voltar ao claro)
                Quando !isDark: mostra 🌙 (para ativar escuro)
            */}
            <button
              onClick={toggle}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              className="
                w-10 h-10 flex items-center justify-center
                rounded-full text-base
                bg-[var(--color-bg-surface)]
                border border-[var(--color-border)]
                text-[var(--color-text-secondary)]
                hover:border-[var(--color-primary)]
                hover:text-[var(--color-primary)]
                hover:scale-105
                transition-all
              "
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Botão menu mobile — visível só em mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="
                md:hidden
                w-10 h-10 flex items-center justify-center
                rounded-xl text-base
                bg-[var(--color-bg-surface)]
                border border-[var(--color-border)]
                text-[var(--color-text-primary)]
                hover:border-[var(--color-primary)]
                transition-all
              "
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════
          MENU MOBILE (Overlay)
          ═══════════════════════════════════════
          Usamos classes Tailwind para o overlay e o painel.
          A animação de entrada usa translate com transition.
      */}
      {/* Overlay escuro */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`
          fixed inset-0 z-[9998]
          bg-black/70 backdrop-blur-sm
          transition-opacity duration-300
          ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        aria-hidden="true"
      />

      {/* Painel lateral */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-[9999]
          w-[min(320px,85vw)]
          bg-[var(--color-bg-surface)]
          shadow-[var(--shadow-xl)]
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
        `}
        aria-label="Menu de navegação"
      >
        {/* Cabeçalho do painel */}
        <div
          className="
            flex items-center justify-between
            px-6 pt-6 pb-4
            border-b border-[var(--color-border)]
          "
        >
          <span className="font-display font-extrabold text-lg text-gradient-eco">
            🍃 EcoShop
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="
              w-9 h-9 flex items-center justify-center
              rounded-full
              bg-[var(--color-bg-surface-hover)]
              text-[var(--color-text-primary)]
              hover:bg-[var(--color-primary)]
              hover:text-white
              hover:rotate-90
              transition-all duration-300
            "
          >
            ✕
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex flex-col gap-2 p-5 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3.5
                rounded-xl font-medium text-base
                bg-[var(--color-bg-body)]
                text-[var(--color-text-secondary)]
                hover:bg-[var(--color-primary-light)]
                hover:text-[var(--color-primary)]
                transition-all
                ${
                  isActive(item.href)
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold"
                    : ""
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA no rodapé do painel */}
        <div className="p-5 border-t border-[var(--color-border)]">
          <Link
            href="/sign-in"
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-full
              bg-[var(--color-primary)]
              text-white font-semibold
              shadow-[var(--shadow-btn)]
              hover:bg-[var(--color-primary-hover)]
              transition-all
            "
          >
            Entrar na conta
          </Link>
        </div>
      </div>
    </>
  );
}
