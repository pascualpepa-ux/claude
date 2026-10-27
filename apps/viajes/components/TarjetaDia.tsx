"use client";

import { ForkKnife, Plus, Star, Sparkle, X, Umbrella, Info } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import { formatoDia } from "@/lib/fechas";
import type { Actividad, DiaItinerario } from "@/lib/types";
import type { Idioma } from "@/lib/idioma";
import { EstadoDato } from "./EstadoDato";
import { IconoClima } from "./IconoClima";
import { useIdioma } from "./ProveedorIdioma";

const ICONO_TIPO = { imperdible: Star, comida: ForkKnife, experiencia: Sparkle };

function formatoHoras(h: number, idioma: Idioma) {
  return h < 1 ? `${Math.round(h * 60)} min` : `${idioma === "es" ? String(h).replace(".", ",") : h} h`;
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
  const { idioma, t } = useIdioma();
  const { clima } = dia;
  const sinDatos = clima.tipo === "sin_datos";
  const mojado = !sinDatos && (clima.condicion === "lluvia" || clima.condicion === "tormenta" || clima.condicion === "nieve");
  return (
    <article className="rounded-2xl border border-arena-200 bg-papel p-4 shadow-sm shadow-arena-200/50 sm:p-5 dark:border-arena-800 dark:bg-arena-900 dark:shadow-none">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-oliva-700 dark:text-oliva-300">{t.dia.numero(numero)}</p>
          <h3 className="text-lg font-semibold tracking-tight first-letter:uppercase">{formatoDia(dia.fecha, idioma)}</h3>
          <p className="text-sm text-arena-600 dark:text-arena-400">{dia.ciudad}</p>
        </div>
        {sinDatos ? (
          <p className="shrink-0 text-sm text-arena-500 dark:text-arena-400">{t.clima.sinDatos}</p>
        ) : (
        <div className="flex shrink-0 items-center gap-2 sm:text-right">
          <IconoClima condicion={clima.condicion} />
          <div>
            <p className="text-sm font-medium tabular-nums">
              {clima.maxima}° <span className="text-arena-500 dark:text-arena-400">/ {clima.minima}°</span>
            </p>
            <p className="text-xs text-arena-500 dark:text-arena-400">
              {t.clima.resumen(t.clima[clima.condicion], clima.probLluvia)}
            </p>
          </div>
        </div>
        )}
      </header>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-arena-50 px-3 py-2 text-sm text-arena-700 dark:bg-arena-800/60 dark:text-arena-300">
        {mojado ? (
          <Umbrella size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        ) : (
          <Info size={18} className="mt-0.5 shrink-0 text-arena-500" aria-hidden />
        )}
        <span>
          {dia.consejo}
          {clima.tipo === "historico" ? (
            <span className="block text-xs text-arena-500 dark:text-arena-400">{t.clima.historico}</span>
          ) : (
            clima.confianza === "baja" &&
            !sinDatos && (
              <span className="block text-xs text-arena-500 dark:text-arena-400">
                {t.clima.bajaConfianza}
              </span>
            )
          )}
          {/* Fuente y verificación del clima real (los datos de ejemplo no la muestran) */}
          {clima.tipo && !sinDatos && (
            <span className="mt-1.5 block">
              <EstadoDato origen={clima.origen} />
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
                <Icono size={18} weight="duotone" aria-label={t.dia.tipos[a.tipo]} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.nombre}</p>
                <p className="text-xs text-arena-500 dark:text-arena-400">
                  {formatoHoras(a.horas, idioma)}, {a.aireLibre ? t.dia.aireLibre : t.dia.bajoTecho}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm tabular-nums">
                {a.precioPorPersona === 0 ? t.dia.gratis : usd(a.precioPorPersona, idioma)}
                {a.precioPorPersona > 0 && (
                  <span className="block text-xs text-arena-500 dark:text-arena-400">{t.dia.porPersona}</span>
                )}
              </p>
              {onQuitar && (
                <button
                  type="button"
                  onClick={() => onQuitar(a.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-arena-500 transition hover:bg-arena-100 hover:text-arena-900 active:scale-95 dark:hover:bg-arena-800 dark:hover:text-arena-100"
                  aria-label={t.dia.sacar(a.nombre)}
                >
                  <X size={16} />
                </button>
              )}
            </li>
          );
        })}
        {actividades.length === 0 && (
          <li className="py-3 text-sm text-arena-500 dark:text-arena-400">{t.dia.libre}</li>
        )}
      </ul>

      {onAgregar && sugerencias.length > 0 && (
        <details className="group mt-2">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-oliva-700 hover:bg-oliva-50 dark:text-oliva-300 dark:hover:bg-oliva-950/50">
            <Plus size={16} weight="bold" aria-hidden />
            {t.dia.sumar}
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
                      {formatoHoras(a.horas, idioma)}, {a.aireLibre ? t.dia.aireLibre : t.dia.bajoTecho}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {a.precioPorPersona === 0 ? t.dia.gratis : usd(a.precioPorPersona, idioma)}
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
