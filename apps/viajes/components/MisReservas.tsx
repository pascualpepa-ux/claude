"use client";

import { useEffect, useState } from "react";
import { AirplaneTilt, Bed, Ticket } from "@phosphor-icons/react/dist/ssr";
import { leerReservas, type ReservaGuardada } from "@/lib/almacen";
import { LOCALE } from "@/lib/idioma";
import { useIdioma } from "./ProveedorIdioma";

/** Vuelos y hoteles pagados en este dispositivo. Se guardan solos al comprar. No muestra nada si no hay. */
export function MisReservas() {
  const { idioma } = useIdioma();
  const [reservas, setReservas] = useState<ReservaGuardada[]>([]);
  useEffect(() => setReservas(leerReservas()), []);
  if (!reservas.length) return null;
  const es = idioma === "es";
  return (
    <section aria-labelledby="titulo-reservas" className="border-b border-arena-200 bg-papel dark:border-arena-800 dark:bg-arena-900/60">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="titulo-reservas" className="flex items-center gap-2 text-lg font-semibold">
            <Ticket size={20} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
            {es ? "Tus reservas" : "Your bookings"}
          </h2>
          <p className="text-sm text-arena-600 dark:text-arena-400">{es ? "El detalle y el link para cancelar están en tu email." : "Details and the cancel link are in your email."}</p>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reservas.map((r) => {
            const Icono = r.tipo === "vuelo" ? AirplaneTilt : Bed;
            return (
              <li key={r.codigo} className="flex gap-3 rounded-2xl border border-arena-200 bg-arena-50 p-4 dark:border-arena-800 dark:bg-arena-950">
                <Icono size={26} weight="duotone" className="mt-0.5 shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.titulo}</span>
                  <span className="block text-sm text-arena-600 dark:text-arena-400">{r.detalle}</span>
                  <span className="mt-1 block text-sm">
                    <span className="font-mono font-semibold tracking-wider">{r.codigo}</span> · {r.precio.toLocaleString(LOCALE[idioma], { style: "currency", currency: r.moneda })}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
