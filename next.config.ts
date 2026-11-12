import type { NextConfig } from "next";

/**
 * Security headers on every response (REQ-OPS-12).
 *
 * - Permissions-Policy: the application uses no camera, microphone or geolocation
 *   (EcoScan uploads a file through <input>; it does not use the browser camera).
 * - Strict-Transport-Security only in production and with a short max-age, without
 *   includeSubDomains or preload: it is hard to undo. Raising the max-age is
 *   a future change, after confirming that every path works over
 *   HTTPS. Over HTTP the browser ignores the header.
 * - No Content-Security-Policy: left for a spec of its own.
 */
function securityHeaders() {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
  if (process.env.NODE_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=300",
    });
  }
  return headers;
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
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
