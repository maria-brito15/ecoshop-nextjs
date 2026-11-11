// app/layout.tsx

/**
 * ROOT LAYOUT
 *
 * The application's root layout - wraps ALL pages.
 *
 * Responsibilities:
 * - Configure global metadata (SEO)
 * - Load custom fonts (Syne and Plus Jakarta Sans)
 * - Include the global Header (navigation)
 * - Provide the base HTML structure
 *
 * Characteristics:
 * - suppressHydrationWarning: avoids mismatch warnings
 *   between SSR and the client (useful for dark mode)
 * - antialiased: smooths fonts in the browser
 *
 * @see app/components/Header.tsx - Global navigation component
 * @see app/globals.css - Global styles and CSS variables
 */

import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import FloatingChat from "./components/FloatingChat";

/**
 * Syne font - used for headings and highlight elements.
 * Characteristics: geometric, modern, with weight 800 for extra bold.
 */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Plus Jakarta Sans font - used for body text.
 * Characteristics: readable, clean, good for long texts.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Global metadata for SEO and social media sharing.
 *
 * title.default: used when the page does not define its own title
 * title.template: appends " | EcoShop" to the end of each page title
 * description: default description for search engines
 * openGraph: settings for sharing on Facebook, LinkedIn, etc.
 */
export const metadata: Metadata = {
  title: {
    default: "EcoShop — Your choice makes a difference",
    template: "%s | EcoShop",
  },
  description:
    "Discover sustainable products that care for you and the planet.",
  openGraph: {
    title: "EcoShop",
    description: "Sustainable products for a better future.",
    type: "website",
  },
};

/**
 * Root Layout - the application's base structure.
 *
 * @param children - Nested page components
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
        <FloatingChat />
      </body>
    </html>
  );
}
