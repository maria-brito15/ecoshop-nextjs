import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança de todas as respostas (REQ-OPS-12).
 *
 * - Permissions-Policy: a aplicação não usa câmera, microfone nem geolocalização
 *   (o EcoScan envia arquivo por <input>, não usa a câmera do navegador).
 * - Strict-Transport-Security só em produção e com validade curta, sem
 *   includeSubDomains nem preload: é difícil de desfazer. Aumentar a validade é
 *   uma mudança futura, depois de confirmar que todos os caminhos funcionam em
 *   HTTPS. Em HTTP o navegador ignora o cabeçalho.
 * - Sem Content-Security-Policy: fica para uma spec própria.
 */
function cabecalhosDeSeguranca() {
  const cabecalhos = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
  if (process.env.NODE_ENV === "production") {
    cabecalhos.push({
      key: "Strict-Transport-Security",
      value: "max-age=300",
    });
  }
  return cabecalhos;
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca() }];
  },
};

export default nextConfig;
