// app/components/Header.tsx - FIXED VERSION
// Changes: Add a call to /api/auth/refresh after loading the user data

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { TipoUsuario } from "@/types/api";
import { fetchSession, endClientSession } from "@/lib/hooks/session";

type SessionUser = {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
};

const NAV_ITEMS = [
  { label: "Home", href: "/", page: "inicio" },
  { label: "Produtos", href: "/produtos", page: "produtos" },
  { label: "Education", href: "/educacao", page: "educacao" },
  { label: "EcoScan IA", href: "/ia-scan", page: "ecoscan" },
  { label: "Sobre", href: "/about", page: "sobre" },
] as const;

const STORAGE_KEY = "ecoShopTheme";

function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return scrolled;
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const shouldBeDark = saved === "true";
    setIsDark(shouldBeDark);
    applyDarkClass(shouldBeDark);
  }, []);

  useEffect(() => {
    applyDarkClass(isDark);
    localStorage.setItem(STORAGE_KEY, String(isDark));
  }, [isDark]);

  function applyDarkClass(dark: boolean) {
    const html = document.documentElement;
    html.classList.toggle("dark-mode", dark);
  }

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

function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetchSession()
      .then((user) => setUser(user))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return { usuario: user, carregando: loading, refresh };
}

export default function Header() {
  const scrolled = useScrolled();
  const { isDark, toggle } = useDarkMode();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { usuario: user, carregando: loading, refresh } = useSession();

  useEffect(() => {
    refresh();
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await endClientSession();
    refresh();
    setProfileMenuOpen(false);
    router.push("/");
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initial = user?.nome?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <header className={`main-header ${scrolled ? "scrolled" : ""}`}>
        <div
          className="
            max-w-[1400px] mx-auto h-full
            px-6 md:px-10
            flex items-center justify-between gap-8
          "
        >
          <Link
            href="/"
            className="
              flex items-center gap-3
              font-display text-xl font-extrabold
              text-[var(--color-text-primary)]
              hover:-translate-y-px transition-transform
            "
          >
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
            <span className="text-gradient-eco">EcoShop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!loading &&
              (user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    aria-label="Profile menu"
                    title={user.nome}
                    className="
                      hidden sm:flex items-center gap-2
                      px-3 py-2
                      rounded-full
                      bg-[var(--color-bg-surface)]
                      border border-[var(--color-border)]
                      hover:border-[var(--color-primary)]
                      transition-all
                    "
                  >
                    <span
                      className="
                        w-7 h-7 flex items-center justify-center
                        rounded-full text-xs font-bold text-white
                        bg-[var(--color-primary)]
                      "
                    >
                      {initial}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] max-w-[100px] truncate">
                      {user.nome.split(" ")[0]}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--color-text-secondary)]"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div
                      className="
                        absolute right-0 top-full mt-2 z-[9997]
                        w-48 rounded-2xl overflow-hidden
                        bg-[var(--color-bg-surface)]
                        border border-[var(--color-border)]
                        shadow-[var(--shadow-lg)]
                        flex flex-col py-1
                      "
                    >
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {user.nome}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/perfil"
                        onClick={() => setProfileMenuOpen(false)}
                        className="
                          flex items-center gap-2.5 px-4 py-3
                          text-sm text-[var(--color-text-secondary)]
                          hover:bg-[var(--color-primary-light)]
                          hover:text-[var(--color-primary)]
                          transition-colors
                        "
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        My Profile
                      </Link>
                      {user.tipo === "ADMIN" && (
                        <Link
                          href="/painel"
                          onClick={() => setProfileMenuOpen(false)}
                          className="
                            flex items-center gap-2.5 px-4 py-3
                            text-sm text-[var(--color-text-secondary)]
                            hover:bg-[var(--color-primary-light)]
                            hover:text-[var(--color-primary)]
                            transition-colors
                          "
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="
                          flex items-center gap-2.5 px-4 py-3
                          text-sm text-red-500
                          hover:bg-red-50
                          transition-colors w-full text-left
                        "
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
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
                  Sign in
                </Link>
              ))}

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
        aria-label="Navigation menu"
      >
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

        <div className="p-5 border-t border-[var(--color-border)]">
          {user ? (
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center justify-center gap-2
                py-3 rounded-full
                bg-red-500
                text-white font-semibold
                hover:bg-red-600
                transition-all
              "
            >
              Sign out of your account
            </button>
          ) : (
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
              Sign in to your account
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
