import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Título, descripción y vista previa siempre en el <head>: los leen Google, WhatsApp, etc.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      { source: "/embed/:path*", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] },
      { source: "/((?!embed).*)", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" }] },
      {
        source: "/api/portada/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
