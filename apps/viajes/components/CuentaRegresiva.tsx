"use client";

import { useEffect, useState } from "react";
import { leerReservas } from "@/lib/almacen";
import { diasHasta } from "@/lib/viaje-chat";
import type { Condicion } from "@/lib/types";
import { IconoClima } from "./IconoClima";
import { useIdioma } from "./ProveedorIdioma";

type Proximo = { fecha: string; ciudad: string; iata: string };
type Clima = { tipo: "pronostico" | "historico" | "sin_datos"; condicion: Condicion; maxima: number; minima: number };

const T = {
  es: {
    faltan: "Faltan",
    para: "para",
    hoy: (c: string) => `¡Hoy viajás a ${c}!`,
    unidades: ["días", "horas", "min", "seg"],
    pronostico: "Pronóstico para ese día",
    historico: "Suele hacer",
    buenViaje: "¡Buen viaje! ✈️",
  },
  en: {
    faltan: "",
    para: "until",
    hoy: (c: string) => `You fly to ${c} today!`,
    unidades: ["days", "hours", "min", "sec"],
    pronostico: "Forecast for that day",
    historico: "Usually",
    buenViaje: "Have a great trip! ✈️",
  },
};

/** El próximo viaje pagado en este dispositivo (el más cercano que todavía no pasó). */
function proximoViaje(): Proximo | null {
  const futuros = leerReservas()
    .map((r) => r.viaje)
    .filter((v): v is Proximo => !!v?.fecha && diasHasta(v.fecha) >= 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return futuros[0] ?? null;
}

/** Cuenta regresiva hasta el próximo viaje comprado, con el clima de allá. No muestra nada si no hay viaje. */
export function CuentaRegresiva() {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const [viaje, setViaje] = useState<Proximo | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [clima, setClima] = useState<Clima | null>(null);

  useEffect(() => setViaje(proximoViaje()), []);
  useEffect(() => {
    if (!viaje) return;
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    fetch("/api/clima", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lugares: [{ iata: viaje.iata, fechas: [viaje.fecha] }] }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const dato = d?.[viaje.iata]?.[viaje.fecha] as Clima | undefined;
        if (dato && dato.tipo !== "sin_datos") setClima(dato);
      })
      .catch(() => {});
    return () => clearInterval(reloj);
  }, [viaje]);

  if (!viaje) return null;
  const [a, m, d] = viaje.fecha.split("-").map(Number);
  const resta = Math.max(0, new Date(a, m - 1, d).getTime() - ahora);
  const partes = [Math.floor(resta / 86_400_000), Math.floor(resta / 3_600_000) % 24, Math.floor(resta / 60_000) % 60, Math.floor(resta / 1000) % 60];
  const esHoy = diasHasta(viaje.fecha) === 0;

  return (
    <section aria-label={t.hoy(viaje.ciudad)} className="aparecer relative overflow-hidden rounded-3xl bg-gradient-to-br from-oliva-700 to-oliva-900 p-5 text-white shadow-lg sm:p-7 dark:from-oliva-800 dark:to-arena-950">
      <span aria-hidden className="avion-cruza pointer-events-none absolute top-4 text-3xl">✈️</span>
      {esHoy ? (
        <p className="text-2xl font-bold sm:text-3xl">{t.hoy(viaje.ciudad)} 🎉</p>
      ) : (
        <>
          <p className="text-sm font-medium tracking-wide text-oliva-100 uppercase">
            {idioma === "es" ? `${t.faltan} ${partes[0]} ${t.unidades[0]} ${t.para} ${viaje.ciudad}` : `${partes[0]} ${t.unidades[0]} ${t.para} ${viaje.ciudad}`}
          </p>
          <ol className="mt-3 grid max-w-md grid-cols-4 gap-2 sm:gap-3">
            {partes.map((n, i) => (
              <li key={i} className="rounded-2xl bg-white/12 px-1 py-3 text-center backdrop-blur-sm">
                <span className="block text-3xl font-bold tabular-nums sm:text-4xl">{String(n).padStart(i ? 2 : 1, "0")}</span>
                <span className="block text-xs text-oliva-100">{t.unidades[i]}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {clima && (
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 font-medium text-arena-900">
            <IconoClima condicion={clima.condicion} size={22} />
            {clima.tipo === "pronostico" ? t.pronostico : t.historico}: {clima.maxima}° / {clima.minima}°
          </span>
        )}
        <span className="text-oliva-100">{t.buenViaje}</span>
      </div>
    </section>
  );
}
