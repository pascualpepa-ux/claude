import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { modoPrueba, ventaPermitida } from "@/lib/duffel";
import { Reservar } from "./Reservar";

export const dynamic = "force-dynamic";
// Mientras esté en modo prueba no aparece en Google.
export const metadata: Metadata = { title: "Comprá tu vuelo | Rumbo Traveling", robots: { index: false, follow: false } };

export default function PaginaReservar() {
  if (!ventaPermitida()) notFound();
  return <Reservar prueba={modoPrueba()} />;
}
