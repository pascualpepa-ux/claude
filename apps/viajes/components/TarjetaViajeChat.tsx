"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AirplaneTilt, Bed } from "@phosphor-icons/react/dist/ssr";
import { LOCALE, type Idioma } from "@/lib/idioma";
import type { ViajeChat } from "@/lib/viaje-chat";

const T = {
  es: {
    personas: (n: number) => (n === 1 ? "1 persona" : `${n} personas`),
    vuelo: "Vuelo ida y vuelta",
    hotel: "Hotel",
    desde: "desde",
    total: "total",
    buscando: "Buscando precios reales…",
    sinPrecio: "Mirá las opciones",
    verVuelos: "Ver vuelos",
    verHoteles: "Ver hoteles",
  },
  en: {
    personas: (n: number) => (n === 1 ? "1 person" : `${n} people`),
    vuelo: "Round-trip flight",
    hotel: "Hotel",
    desde: "from",
    total: "total",
    buscando: "Finding real prices…",
    sinPrecio: "See the options",
    verVuelos: "See flights",
    verHoteles: "See hotels",
  },
};

type Precio = { monto: number; moneda: string } | null | "cargando";

async function masBarato(url: string, cuerpo: object, lista: "ofertas" | "hoteles"): Promise<Precio> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (!res.ok) return null;
    const items = ((await res.json())[lista] ?? []) as { precio: number; moneda: string }[];
    const min = items.reduce<{ precio: number; moneda: string } | null>((m, x) => (!m || x.precio < m.precio ? x : m), null);
    return min ? { monto: min.precio, moneda: min.moneda } : null;
  } catch {
    return null;
  }
}

/** Viaje que propuso el chat: precios reales del vuelo y del hotel más baratos, con botones para comprar. */
export function TarjetaViajeChat({ viaje, idioma, listo }: { viaje: ViajeChat; idioma: Idioma; listo: boolean }) {
  const t = T[idioma];
  const [vuelo, setVuelo] = useState<Precio>("cargando");
  const [hotel, setHotel] = useState<Precio>("cargando");
  const huespedes = Math.min(4, viaje.adultos);
  const clave = `${viaje.origen}${viaje.destino}${viaje.ida}${viaje.vuelta}${viaje.adultos}`;

  useEffect(() => {
    if (!listo) return;
    let vivo = true;
    masBarato("/api/reservas/buscar", { origen: viaje.origen, destino: viaje.destino, ida: viaje.ida, vuelta: viaje.vuelta, adultos: viaje.adultos }, "ofertas").then((p) => vivo && setVuelo(p));
    masBarato("/api/reservas/hoteles/buscar", { aeropuerto: viaje.destino, entrada: viaje.ida, salida: viaje.vuelta, adultos: huespedes }, "hoteles").then((p) => vivo && setHotel(p));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, clave]);

  const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString(LOCALE[idioma], { day: "numeric", month: "short" });
  const precio = (p: Precio) =>
    p === "cargando" ? (
      <span className="animate-pulse text-arena-500">{t.buscando}</span>
    ) : p ? (
      <span>
        {t.desde} <strong className="text-base">{p.monto.toLocaleString(LOCALE[idioma], { style: "currency", currency: p.moneda, maximumFractionDigits: 0 })}</strong> {t.total}
      </span>
    ) : (
      <span className="text-arena-500">{t.sinPrecio}</span>
    );

  const vuelos = `/reservar?origen=${viaje.origen}&destino=${viaje.destino}&ida=${viaje.ida}&vuelta=${viaje.vuelta}&adultos=${viaje.adultos}`;
  const hoteles = `/reservar?tipo=hotel&destino=${viaje.destino}&entrada=${viaje.ida}&salida=${viaje.vuelta}&adultos=${huespedes}`;

  return (
    <div className="aparecer w-[85%] overflow-hidden rounded-2xl border border-oliva-600/40 bg-papel shadow-sm dark:border-oliva-300/30 dark:bg-arena-950">
      <div className="bg-oliva-700 px-3.5 py-2.5 text-white dark:bg-oliva-300 dark:text-arena-950">
        <p className="font-semibold">
          ✈️ {viaje.origen} → {viaje.ciudad}
        </p>
        <p className="text-xs opacity-90">
          {fecha(viaje.ida)} – {fecha(viaje.vuelta)} · {t.personas(viaje.adultos)}
        </p>
      </div>
      <ul className="divide-y divide-arena-200 text-sm dark:divide-arena-800">
        {(
          [
            [AirplaneTilt, t.vuelo, vuelo, vuelos, t.verVuelos],
            [Bed, t.hotel, hotel, hoteles, t.verHoteles],
          ] as const
        ).map(([Icono, nombre, p, href, boton]) => (
          <li key={nombre} className="flex items-center gap-3 px-3.5 py-2.5">
            <Icono size={22} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{nombre}</span>
              <span className="block text-xs">{precio(p)}</span>
            </span>
            <Link
              href={href}
              className="shrink-0 rounded-lg bg-oliva-700 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950"
            >
              {boton}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
