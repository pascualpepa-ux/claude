import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Título, descripción y vista previa siempre dentro del <head> (no en streaming): así los leen
  // Google, WhatsApp, iMessage y cualquier otra herramienta, sea o no un robot conocido.
  htmlLimitedBots: /.*/,
  images: { formats: ["image/avif", "image/webp"] },
  // El concurso empezó como "sorteo": los links viejos siguen funcionando.
  async redirects() {
    return [
      { source: "/sorteo", destination: "/concurso", permanent: true },
      { source: "/sorteo/:resto*", destination: "/concurso/:resto*", permanent: true },
    ];
  },
};

export default nextConfig;
