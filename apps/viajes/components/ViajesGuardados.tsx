"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookmarkSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import { abrirGuardado, borrarGuardado, leerGuardados, type ViajeGuardado } from "@/lib/almacen";
import { usd } from "@/lib/dinero";
import { formatoCorto } from "@/lib/fechas";
import { calcularResumen } from "@/lib/presupuesto";
import { useIdioma } from "./ProveedorIdioma";

/** Viajes que la persona guardó en este dispositivo. No muestra nada si no hay ninguno. */
export function ViajesGuardados() {
  const router = useRouter();
  const { idioma, t } = useIdioma();
  const ti = t.inicio;
  // Se leen recién en el navegador: el servidor no conoce lo guardado en el dispositivo.
  const [viajes, setViajes] = useState<ViajeGuardado[]>([]);
  useEffect(() => setViajes(leerGuardados()), []);

  if (viajes.length === 0) return null;

  const abrir = (v: ViajeGuardado) => {
    abrirGuardado(v);
    router.push("/viaje");
  };
  const borrar = (v: ViajeGuardado, titulo: string) => {
    if (!window.confirm(ti.confirmarBorrar(titulo))) return;
    borrarGuardado(v.id);
    setViajes(leerGuardados());
  };

  return (
    <section aria-labelledby="titulo-guardados" className="aparecer border-b border-arena-200 bg-papel dark:border-arena-800 dark:bg-arena-900/60">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="titulo-guardados" className="flex items-center gap-2 text-lg font-semibold">
            <BookmarkSimple size={20} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
            {ti.guardadosTitulo}
          </h2>
          <p className="text-sm text-arena-600 dark:text-arena-400">{ti.guardadosNota}</p>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {viajes.map((v) => {
            const { input } = v.plan;
            const titulo = t.viaje.titulo(input.origen, input.destino);
            let porPersona: number | null = null;
            try {
              porPersona = calcularResumen(v.plan).porPersona;
            } catch {}
            return (
              <li key={v.id} className="flex items-stretch rounded-2xl border border-arena-200 bg-arena-50 transition hover:border-oliva-600 dark:border-arena-800 dark:bg-arena-950 dark:hover:border-oliva-300">
                <button type="button" onClick={() => abrir(v)} className="min-w-0 flex-1 p-4 text-left">
                  <span className="block truncate font-semibold">{titulo}</span>
                  <span className="mt-0.5 block text-sm text-arena-600 dark:text-arena-400">
                    {formatoCorto(input.fechaIda, idioma)} – {formatoCorto(input.fechaVuelta, idioma)} · {ti.cantidadViajeros(input.viajeros.length)}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    {porPersona !== null && (
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold">{usd(porPersona, idioma)}</span> {t.presupuesto.porPersonaCorto}
                      </span>
                    )}
                    <ArrowRight size={18} weight="bold" className="ml-auto shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => borrar(v, titulo)}
                  aria-label={ti.borrarViaje(titulo)}
                  title={ti.borrar}
                  className="grid w-11 shrink-0 place-items-center rounded-r-2xl border-l border-arena-200 text-arena-500 transition hover:bg-red-50 hover:text-red-700 dark:border-arena-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <Trash size={18} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
