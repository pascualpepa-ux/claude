import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import { BarraSorteo } from "@/components/Sorteo";
import { sorteoActivo } from "@/lib/sorteo";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import { ProveedorIdioma } from "@/components/ProveedorIdioma";
import { textosActuales } from "@/lib/idioma-servidor";
import { SITIO_URL, metadatosPagina } from "@/lib/seo";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import "./globals.css";

// Google Sans Flex: la tipografía del logo (licencia SIL OFL, ver app/fuentes/OFL.txt).
const marca = localFont({
  src: "./fuentes/GoogleSansFlex-latin.woff2",
  weight: "400 700",
  variable: "--font-marca",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  // Valores por defecto para todas las páginas; cada página pública define su título, descripción y hreflang.
  return {
    metadataBase: new URL(SITIO_URL),
    applicationName: "Rumbo Traveling",
    ...metadatosPagina({ ruta: "/", idioma, titulo: t.meta.titulo, descripcion: t.meta.descripcion, tituloAbsoluto: true }),
    alternates: undefined, // el canonical y el hreflang los pone cada página
    authors: [{ name: "Pascual Pepa" }],
    creator: "Pascual Pepa",
    appleWebApp: { capable: true, title: "Rumbo", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#16150f" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { idioma } = await textosActuales();
  return (
    <html lang={idioma} className={marca.variable}>
      <body className="flex min-h-[100dvh] flex-col font-sans">
        <ProveedorIdioma idioma={idioma}>
          {sorteoActivo() && <BarraSorteo />}
          <Encabezado />
          <div className="flex-1">{children}</div>
          <Pie />
        </ProveedorIdioma>
        <DatosEstructurados idioma={idioma} />
        {process.env.GOATCOUNTER_CODE && <ContadorVisitas codigo={process.env.GOATCOUNTER_CODE} />}
      </body>
    </html>
  );
}
