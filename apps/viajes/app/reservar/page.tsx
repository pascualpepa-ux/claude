import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { modoPrueba, telefonoAgencia, ventaPermitida } from "@/lib/duffel";
import { hotelesPermitido, hotelesPrueba } from "@/lib/hoteles";
import { Pestanas } from "./Pestanas";

export const dynamic = "force-dynamic";
// Mientras esté en modo prueba no aparece en Google.
export const metadata: Metadata = { title: "Reservá vuelos y hoteles | Rumbo Traveling", robots: { index: false, follow: false } };

type Q = Record<string, string | undefined>;
const IATA = /^[A-Z]{3}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Datos que llegan desde un viaje armado ("Comprá el vuelo acá mismo"): solo si son válidos. */
function inicialVuelo(q: Q) {
  if (!IATA.test(q.origen ?? "") || !IATA.test(q.destino ?? "") || !FECHA.test(q.ida ?? "")) return undefined;
  return { origen: q.origen!, destino: q.destino!, ida: q.ida!, vuelta: FECHA.test(q.vuelta ?? "") ? q.vuelta! : "", adultos: Math.min(6, Math.max(1, Number(q.adultos) || 1)) };
}
function inicialHotel(q: Q) {
  if (!IATA.test(q.destino ?? "") || !FECHA.test(q.entrada ?? "") || !FECHA.test(q.salida ?? "")) return undefined;
  return { destino: q.destino!, entrada: q.entrada!, salida: q.salida!, adultos: Math.min(4, Math.max(1, Number(q.adultos) || 2)) };
}

export default async function PaginaReservar({ searchParams }: { searchParams: Promise<Q> }) {
  const vuelos = ventaPermitida() ? { prueba: modoPrueba(), telefonoOpcional: /^\+\d{7,15}$/.test(telefonoAgencia()) } : null;
  const hoteles = hotelesPermitido() ? { prueba: hotelesPrueba() } : null;
  if (!vuelos && !hoteles) notFound();
  const q = await searchParams;
  const esHotel = q.tipo === "hotel";
  return (
    <Pestanas
      vuelos={vuelos && { ...vuelos, inicial: esHotel ? undefined : inicialVuelo(q) }}
      hoteles={hoteles && { ...hoteles, inicial: esHotel ? inicialHotel(q) : undefined }}
      inicial={esHotel ? "hoteles" : "vuelos"}
    />
  );
}
