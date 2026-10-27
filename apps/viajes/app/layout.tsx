import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import { ProveedorIdioma } from "@/components/ProveedorIdioma";
import { textosActuales } from "@/lib/idioma-servidor";
import { suscripcionesActivas } from "@/lib/suscripciones";
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
  return {
    metadataBase: new URL("https://rumbotraveling.com"),
    title: t.meta.titulo,
    description: t.meta.descripcion,
    openGraph: {
      title: "Rumbo Traveling",
      description: t.meta.descripcion,
      images: ["/marca/icono-512.png"],
      locale: idioma === "en" ? "en_US" : "es_AR",
      type: "website",
    },
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
          <Encabezado />
          <div className="flex-1">{children}</div>
          <Pie suscripciones={suscripcionesActivas()} />
        </ProveedorIdioma>
        {process.env.GOATCOUNTER_CODE && <ContadorVisitas codigo={process.env.GOATCOUNTER_CODE} />}
      </body>
    </html>
  );
}
