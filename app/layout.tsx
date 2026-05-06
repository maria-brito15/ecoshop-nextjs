// app/layout.tsx

import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

// configura a fonte Syne (usada em títulos via --font-display no globals.css)
// o Next.js baixa e serve a fonte localmente, sem depender do Google Fonts em runtime
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display", // nome da variável CSS que será injetada no <html>
  display: "swap", // exibe a fonte fallback enquanto a Syne carrega (evita FOIT)
});

// configura a fonte Plus Jakarta Sans (usada em textos via --font-body no globals.css)
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// metadados do site — usados pelo Next.js para gerar as tags <title> e <meta> automaticamente
export const metadata: Metadata = {
  title: {
    default: "EcoShop — Sua escolha faz a diferença", // título da home
    template: "%s | EcoShop", // título das outras páginas: ex "Produtos | EcoShop"
  },
  description:
    "Descubra produtos sustentáveis que cuidam de você e do planeta.",
  keywords: ["ecoshop", "sustentável", "produtos ecológicos", "eco-friendly"],
  openGraph: {
    // metadados para preview ao compartilhar o link no WhatsApp, Twitter, etc.
    title: "EcoShop",
    description: "Produtos sustentáveis para um futuro melhor.",
    type: "website",
  },
};

// RootLayout envolve TODAS as páginas do app
// é equivalente ao _app.tsx do Next.js antigo (Pages Router)
export default function RootLayout({
  children, // representa o conteúdo da página atual sendo renderizada
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${plusJakarta.variable}`}
      // injeta as variáveis --font-display e --font-body no <html>
      // assim o globals.css consegue acessá-las em qualquer lugar da página
      suppressHydrationWarning
      // suprime o aviso do React quando o HTML gerado no servidor difere do cliente
      // necessário aqui porque o dark mode altera o className do <html> no browser
    >
      <body className="antialiased">
        {/* antialiased = classe do Tailwind que aplica -webkit-font-smoothing */}
        <Header /> {/* header fixo que aparece em todas as páginas */}
        {children} {/* conteúdo específico de cada página */}
      </body>
    </html>
  );
}
