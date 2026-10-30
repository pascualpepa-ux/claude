"use client";

// Viajes guardados de verdad (Rumbo Premium): se guardan en la base via /api/cuenta/viajes,
// a diferencia de lib/almacen.ts que los guarda solo en este navegador.
import type { TripPlan } from "./types";

export interface ViajeGuardadoDb {
  id: string;
  nombre: string;
  guardadoEl: string; // ISO
  plan: TripPlan;
  borrador?: unknown;
}

export async function listarViajesPremium(): Promise<ViajeGuardadoDb[]> {
  try {
    const res = await fetch("/api/cuenta/viajes");
    if (!res.ok) return [];
    const j = await res.json().catch(() => ({}));
    return Array.isArray(j.viajes) ? j.viajes : [];
  } catch {
    return [];
  }
}

/** Guarda un viaje nuevo (o actualiza uno, con `id`). Devuelve el id, o null si no se pudo. */
export async function guardarViajePremium(plan: TripPlan, borrador: unknown, id?: string): Promise<string | null> {
  try {
    const res = await fetch("/api/cuenta/viajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, borrador, id }),
    });
    if (!res.ok) return null;
    const j = await res.json().catch(() => ({}));
    return j.viaje?.id ?? null;
  } catch {
    return null;
  }
}

export async function borrarViajePremium(id: string): Promise<void> {
  await fetch(`/api/cuenta/viajes/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}
