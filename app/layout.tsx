// app/layout.tsx

/**
 * ============================================================================
 * ROOT LAYOUT
 * ============================================================================
 * Layout raiz da aplicação - envolve TODAS as páginas.
 *
 * Responsabilidades:
 * - Configurar metadados globais (SEO)
 * - Carregar fontes customizadas (Syne e Plus Jakarta Sans)
 * - Incluir o Header global (navegação)
 * - Prover estrutura HTML base
 *
 * Características:
 * - suppressHydrationWarning: evita warnings de incompatibilidade
 *   entre SSR e client (útil para dark mode)
 * - antialiased: suaviza fontes no navegador
 *
 * @see app/components/Header.tsx - Componente de navegação global
 * @see app/globals.css - Estilos globais e variáveis CSS
 * ============================================================================
 */

import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

/**
 * Fonte Syne - usada para títulos e elementos de destaque.
 * Características: geométrica, moderna, com peso 800 para extrabold.
 */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Fonte Plus Jakarta Sans - usada para corpo de texto.
 * Características: legível, clean, boa para longos textos.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Metadados globais para SEO e compartilhamento em redes sociais.
 *
 * title.default: usado quando a página não define seu próprio título
 * title.template: adiciona " | EcoShop" ao final de cada título de página
 * description: descrição padrão para mecanismos de busca
 * openGraph: configurações para compartilhamento em Facebook, LinkedIn, etc.
 */
export const metadata: Metadata = {
  title: {
    default: "EcoShop — Sua escolha faz a diferença",
    template: "%s | EcoShop",
  },
  description:
    "Descubra produtos sustentáveis que cuidam de você e do planeta.",
  openGraph: {
    title: "EcoShop",
    description: "Produtos sustentáveis para um futuro melhor.",
    type: "website",
  },
};

/**
 * Root Layout - estrutura base da aplicação.
 *
 * @param children - Componentes das páginas aninhadas
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
