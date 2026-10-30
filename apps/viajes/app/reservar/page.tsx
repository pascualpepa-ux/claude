import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { modoPrueba, ventaPermitida } from "@/lib/duffel";
import { hotelesPermitido, hotelesPrueba } from "@/lib/hoteles";
import { Pestanas } from "./Pestanas";

export const dynamic = "force-dynamic";
// Mientras esté en modo prueba no aparece en Google.
export const metadata: Metadata = { title: "Reservá vuelos y hoteles | Rumbo Traveling", robots: { index: false, follow: false } };

export default async function PaginaReservar({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const vuelos = ventaPermitida() ? { prueba: modoPrueba() } : null;
  const hoteles = hotelesPermitido() ? { prueba: hotelesPrueba() } : null;
  if (!vuelos && !hoteles) notFound();
  const { tipo } = await searchParams;
  return <Pestanas vuelos={vuelos} hoteles={hoteles} inicial={tipo === "hotel" ? "hoteles" : "vuelos"} />;
}
