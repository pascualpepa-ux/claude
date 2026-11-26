import type { Metadata, Viewport } from "next";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import { SITIO_URL } from "@/lib/sitio";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: { default: "Playforge — Miles de juegos gratis y un creador de juegos con IA", template: "%s · Playforge" },
  description: "Jugá más de 10.000 juegos gratis en el navegador: plataformas, carreras, puzzles, ritmo, defensa de torres y más. Y creá tu propio juego charlando con una IA.",
  applicationName: "Playforge",
  authors: [{ name: "Pascual Pepa" }],
  creator: "Pascual Pepa",
  openGraph: { type: "website", siteName: "Playforge", locale: "es_AR" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Playforge", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-[100dvh] flex-col font-sans">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-marca focus:px-4 focus:py-2">Ir al contenido</a>
        <Encabezado />
        <main id="contenido" className="flex-1">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
