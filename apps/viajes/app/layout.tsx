import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import { Ayudante } from "@/components/Ayudante";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rumbo · Planificá tu viaje",
  description: "Itinerario, vuelos, hoteles, clima y gastos compartidos en un solo lugar.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-[100dvh] flex-col font-sans">
        <Encabezado />
        <div className="flex-1">{children}</div>
        <Pie />
        <Ayudante />
        {process.env.GOATCOUNTER_CODE && <ContadorVisitas codigo={process.env.GOATCOUNTER_CODE} />}
      </body>
    </html>
  );
}
