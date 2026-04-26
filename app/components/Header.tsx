"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSession {
  nome: string;
  email: string;
  tipo: string; // "ADMIN" | "LOJA" | "CLIENTE"
}

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/", label: "Início", match: (p: string) => p === "/" },
  {
    href: "/produtos",
    label: "Produtos",
    match: (p: string) => p.startsWith("/produtos"),
  },
  {
    href: "/educacao",
    label: "Educação",
    match: (p: string) => p.startsWith("/educacao"),
  },
  {
    href: "/ia-scan",
    label: "EcoScan IA",
    match: (p: string) => p.startsWith("/ia-scan"),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Read session from cookie/localStorage (same approach as original)
  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem("ecoShopUser") ||
        localStorage.getItem("ecoShopUser");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // no session
    }
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    if (!confirm("Deseja realmente sair?")) return;
    sessionStorage.removeItem("ecoShopUser");
    localStorage.removeItem("ecoShopUser");
    setUser(null);
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s";
    setTimeout(() => {
      document.body.style.opacity = "";
      router.push("/");
    }, 300);
  }

  const firstName = user?.nome?.split(" ")[0] ?? "";
  const isAdmin = user?.tipo === "ADMIN";
  const isLoja = user?.tipo === "LOJA";

  return (
    <>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[76px] transition-all duration-300"
        style={
          scrolled
            ? {
                backgroundColor: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(16px) saturate(180%)",
                borderBottom: "1px solid #e3ede8",
                boxShadow: "0 2px 4px rgba(26,58,46,0.06)",
              }
            : {
                backgroundColor: "transparent",
                borderBottom: "1px solid transparent",
              }
        }
      >
        <div className="max-w-[1400px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 no-underline group flex-shrink-0"
          >
            <span
              className="text-[1.6rem] transition-all duration-150 group-hover:rotate-[8deg] group-hover:scale-105"
              style={{ filter: "drop-shadow(0 2px 4px rgba(45,149,105,0.2))" }}
            >
              🌿
            </span>
            <span
              className="text-[1.4rem] font-extrabold tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
              }}
            >
              EcoShop
            </span>
          </Link>

          {/* Nav center — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                active={link.match(pathname)}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Role-based nav items */}
            {isAdmin && (
              <NavLink
                href="/painel"
                active={pathname.startsWith("/painel")}
                accent
              >
                🛡 Admin
              </NavLink>
            )}
            {isLoja && (
              <NavLink
                href="/store"
                active={pathname.startsWith("/store")}
                accent
              >
                🏪 Minha Loja
              </NavLink>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-px"
                  style={{
                    background:
                      "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
                    boxShadow: "0 4px 12px rgba(45,149,105,0.2)",
                  }}
                >
                  <span>👤</span>
                  <span>{firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="w-9 h-9 rounded-full border border-[#e3ede8] bg-transparent
                             text-[#5a7a6f] hover:bg-red-50 hover:text-red-600 hover:border-red-200
                             flex items-center justify-center text-base cursor-pointer transition-all duration-200"
                >
                  ↩
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border-2 border-[#2d9569] text-[#2d9569]
                           font-semibold text-sm hover:bg-[#2d9569] hover:text-white
                           transition-all duration-200"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] cursor-pointer border-none bg-transparent"
            aria-label="Abrir menu"
          >
            <span className="block w-5 h-0.5 bg-[#1a3a2e] rounded-full transition-all duration-200" />
            <span className="block w-5 h-0.5 bg-[#1a3a2e] rounded-full transition-all duration-200" />
            <span className="block w-3 h-0.5 bg-[#1a3a2e] rounded-full transition-all duration-200" />
          </button>
        </div>
      </header>

      {/* Spacer so content doesn't hide under fixed header */}
      <div className="h-[76px]" />

      {/* ── MOBILE OVERLAY ──────────────────────────────────────────────── */}
      <div
        onClick={() => setMobileOpen(false)}
        className="md:hidden fixed inset-0 z-[9998] transition-all duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          opacity: mobileOpen ? 1 : 0,
          visibility: mobileOpen ? "visible" : "hidden",
        }}
      />

      <div
        className="md:hidden fixed top-0 right-0 h-full z-[9999] bg-white
                   flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: "min(320px, 85vw)",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          paddingTop: "80px",
          paddingBottom: "30px",
          paddingLeft: "30px",
          paddingRight: "30px",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#f7faf8]
                     text-[#1a3a2e] flex items-center justify-center text-lg cursor-pointer
                     border-none hover:bg-[#2d9569] hover:text-white transition-all duration-300 hover:rotate-90"
        >
          ✕
        </button>

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🌿</span>
          <span className="text-xl font-extrabold text-[#2d9569]">EcoShop</span>
        </div>

        {/* Mobile nav links */}
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-medium text-base transition-all duration-200
                ${
                  link.match(pathname)
                    ? "bg-[#e6f5ef] text-[#2d9569] font-semibold"
                    : "bg-[#f7faf8] text-[#5a7a6f] hover:bg-[#e6f5ef] hover:text-[#2d9569]"
                }`}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/painel"
              className="flex items-center gap-3 px-5 py-4 rounded-xl font-semibold text-base bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all duration-200"
            >
              🛡 Admin
            </Link>
          )}
          {isLoja && (
            <Link
              href="/store"
              className="flex items-center gap-3 px-5 py-4 rounded-xl font-semibold text-base bg-[#e6f5ef] text-[#2d9569] hover:bg-[#d0ecdf] transition-all duration-200"
            >
              🏪 Minha Loja
            </Link>
          )}
        </nav>

        {/* Mobile auth */}
        <div className="mt-auto pt-8 border-t border-[#e3ede8]">
          {user ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/perfil"
                className="flex items-center gap-3 px-5 py-3 rounded-full text-white font-semibold justify-center transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #2d9569 0%, #1d5d3f 100%)",
                }}
              >
                <span>👤</span>
                <span>Olá, {firstName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 justify-center px-5 py-3 rounded-full border-2 border-red-200 text-red-600 font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-all duration-200"
              >
                ↩ Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block text-center px-5 py-3 rounded-full border-2 border-[#2d9569] text-[#2d9569] font-semibold hover:bg-[#2d9569] hover:text-white transition-all duration-200"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ─── NavLink helper ───────────────────────────────────────────────────────────

function NavLink({
  href,
  active,
  accent = false,
  children,
}: {
  href: string;
  active: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  if (accent) {
    return (
      <Link
        href={href}
        className="relative flex items-center gap-1.5 px-[18px] py-2.5 rounded-lg font-semibold text-[0.95rem] text-white transition-all duration-150 hover:-translate-y-px"
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
          boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-1.5 px-[18px] py-2.5 rounded-lg font-medium text-[0.95rem] transition-all duration-150
        ${
          active
            ? "text-[#2d9569] bg-[#e6f5ef] font-semibold"
            : "text-[#5a7a6f] hover:text-[#1a3a2e] hover:bg-[#f1f6f3]"
        }`}
    >
      {children}
      {/* Underline indicator */}
      <span
        className="absolute bottom-[6px] left-1/2 -translate-x-1/2 h-0.5 bg-[#2d9569] rounded-full transition-all duration-150"
        style={{ width: active ? "32px" : "0px" }}
      />
    </Link>
  );
}
