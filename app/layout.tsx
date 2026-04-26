// app/layout.tsx

import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EcoShop — Sua escolha faz a diferença",
    template: "%s | EcoShop",
  },
  description:
    "Descubra produtos sustentáveis que cuidam de você e do planeta.",
  keywords: ["ecoshop", "sustentável", "produtos ecológicos", "eco-friendly"],
  openGraph: {
    title: "EcoShop",
    description: "Produtos sustentáveis para um futuro melhor.",
    type: "website",
  },
};

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
