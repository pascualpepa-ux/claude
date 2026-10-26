"use client";

import { ForkKnife, Plus, Star, Sparkle, X, Umbrella, Info } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import { formatoDia } from "@/lib/fechas";
import type { Actividad, DiaItinerario } from "@/lib/types";
import { IconoClima, NOMBRE_CONDICION } from "./IconoClima";

const ICONO_TIPO = { imperdible: Star, comida: ForkKnife, experiencia: Sparkle };
const NOMBRE_TIPO = { imperdible: "Imperdible", comida: "Comida típica", experiencia: "Experiencia" };

function formatoHoras(h: number) {
  return h < 1 ? `${Math.round(h * 60)} min` : `${String(h).replace(".", ",")} h`;
}

interface Props {
  numero: number;
  dia: DiaItinerario;
  actividades: Actividad[];
  sugerencias?: Actividad[];
  onQuitar?: (id: string) => void;
  onAgregar?: (id: string) => void;
}

export function TarjetaDia({ numero, dia, actividades, sugerencias = [], onQuitar, onAgregar }: Props) {
  const { clima } = dia;
  const mojado = clima.condicion === "lluvia" || clima.condicion === "tormenta";
  return (
    <article className="rounded-2xl border border-arena-200 bg-papel p-4 shadow-sm shadow-arena-200/50 sm:p-5 dark:border-arena-800 dark:bg-arena-900 dark:shadow-none">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-oliva-700 dark:text-oliva-300">Día {numero}</p>
          <h3 className="text-lg font-semibold tracking-tight first-letter:uppercase">{formatoDia(dia.fecha)}</h3>
          <p className="text-sm text-arena-600 dark:text-arena-400">{dia.ciudad}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:text-right">
          <IconoClima condicion={clima.condicion} />
          <div>
            <p className="text-sm font-medium tabular-nums">
              {clima.maxima}° <span className="text-arena-500 dark:text-arena-400">/ {clima.minima}°</span>
            </p>
            <p className="text-xs text-arena-500 dark:text-arena-400">
              {NOMBRE_CONDICION[clima.condicion]}, lluvia {clima.probLluvia}%
            </p>
          </div>
        </div>
      </header>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-arena-50 px-3 py-2 text-sm text-arena-700 dark:bg-arena-800/60 dark:text-arena-300">
        {mojado ? (
          <Umbrella size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        ) : (
          <Info size={18} className="mt-0.5 shrink-0 text-arena-500" aria-hidden />
        )}
        <span>
          {dia.consejo}
          {clima.confianza === "baja" && (
            <span className="block text-xs text-arena-500 dark:text-arena-400">
              Pronóstico de baja confianza: falta más de 10 días. Se actualiza solo a medida que se acerca la fecha.
            </span>
          )}
        </span>
      </p>

      {dia.nota && <p className="mt-3 text-sm text-arena-600 dark:text-arena-400">{dia.nota}</p>}

      <ul className="mt-3 divide-y divide-arena-100 dark:divide-arena-800">
        {actividades.map((a) => {
          const Icono = ICONO_TIPO[a.tipo];
          return (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-oliva-50 text-oliva-700 dark:bg-oliva-950/60 dark:text-oliva-300">
                <Icono size={18} weight="duotone" aria-label={NOMBRE_TIPO[a.tipo]} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.nombre}</p>
                <p className="text-xs text-arena-500 dark:text-arena-400">
                  {formatoHoras(a.horas)}, {a.aireLibre ? "al aire libre" : "bajo techo"}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm tabular-nums">
                {a.precioPorPersona === 0 ? "Gratis" : usd(a.precioPorPersona)}
                {a.precioPorPersona > 0 && (
                  <span className="block text-xs text-arena-500 dark:text-arena-400">por persona</span>
                )}
              </p>
              {onQuitar && (
                <button
                  type="button"
                  onClick={() => onQuitar(a.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-arena-500 transition hover:bg-arena-100 hover:text-arena-900 active:scale-95 dark:hover:bg-arena-800 dark:hover:text-arena-100"
                  aria-label={`Sacar ${a.nombre}`}
                >
                  <X size={16} />
                </button>
              )}
            </li>
          );
        })}
        {actividades.length === 0 && (
          <li className="py-3 text-sm text-arena-500 dark:text-arena-400">Día libre. Podés sumar una actividad sugerida.</li>
        )}
      </ul>

      {onAgregar && sugerencias.length > 0 && (
        <details className="group mt-2">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-oliva-700 hover:bg-oliva-50 dark:text-oliva-300 dark:hover:bg-oliva-950/50">
            <Plus size={16} weight="bold" aria-hidden />
            Sumar actividad
          </summary>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {sugerencias.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onAgregar(a.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-arena-300 px-3 py-2 text-left text-sm transition hover:border-oliva-600 hover:bg-oliva-50/50 dark:border-arena-700 dark:hover:border-oliva-300 dark:hover:bg-oliva-950/30"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{a.nombre}</span>
                    <span className="text-xs text-arena-500 dark:text-arena-400">
                      {formatoHoras(a.horas)}, {a.aireLibre ? "al aire libre" : "bajo techo"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {a.precioPorPersona === 0 ? "Gratis" : usd(a.precioPorPersona)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
