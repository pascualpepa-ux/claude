import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import "./globals.css";

// Google Sans Flex: la tipografía del logo (licencia SIL OFL, ver app/fuentes/OFL.txt).
const marca = localFont({
  src: "./fuentes/GoogleSansFlex-latin.woff2",
  weight: "400 700",
  variable: "--font-marca",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rumbotraveling.com"),
  title: "Rumbo Traveling · Planificá tu viaje",
  description: "Itinerario, vuelos, hoteles, clima y gastos compartidos en un solo lugar.",
  openGraph: {
    title: "Rumbo Traveling",
    description: "Planificá tu viaje: itinerario, vuelos, hoteles, clima y presupuesto en un solo lugar.",
    images: ["/marca/icono-512.png"],
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#16150f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={marca.variable}>
      <body className="flex min-h-[100dvh] flex-col font-sans">
        <Encabezado />
        <div className="flex-1">{children}</div>
        <Pie />
        {process.env.GOATCOUNTER_CODE && <ContadorVisitas codigo={process.env.GOATCOUNTER_CODE} />}
      </body>
    </html>
  );
}
