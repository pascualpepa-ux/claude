"use client";

import { AirplaneTakeoff, AirplaneLanding, ArrowSquareOut, Suitcase, Backpack, ArrowsClockwise, Receipt } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import { formatoCorto, formatoDuracion, formatoHora } from "@/lib/fechas";
import type { OpcionVuelo, Tramo } from "@/lib/types";
import type { Textos } from "@/lib/textos";
import { EstadoDato } from "./EstadoDato";
import { useIdioma } from "./ProveedorIdioma";

function textoEscalas(tramo: Tramo, t: Textos) {
  if (tramo.escalas.length === 0) return t.vuelo.directo;
  return t.vuelo.escalas(tramo.escalas.length, tramo.escalas.join(t.vuelo.y));
}

function FilaTramo({ titulo, tramo, Icono }: { titulo: string; tramo: Tramo; Icono: React.ElementType }) {
  const { idioma, t } = useIdioma();
  return (
    <div className="flex items-center gap-3">
      <Icono size={20} className="shrink-0 text-arena-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{titulo}</span>{" "}
          <span className="text-arena-600 dark:text-arena-400">{formatoCorto(tramo.salida.slice(0, 10), idioma)}</span>
        </p>
        <p className="text-sm tabular-nums">
          {tramo.desde} {formatoHora(tramo.salida, idioma)} <span className="text-arena-400">{t.vuelo.a}</span> {tramo.hasta}{" "}
          {formatoHora(tramo.llegada, idioma)}
        </p>
      </div>
      <p className="shrink-0 text-right text-xs text-arena-600 dark:text-arena-400">
        {formatoDuracion(tramo.duracionMin)}
        <span className="block">{textoEscalas(tramo, t)}</span>
      </p>
    </div>
  );
}

export function TarjetaVuelo({
  vuelo,
  personas,
  elegido,
  onElegir,
}: {
  vuelo: OpcionVuelo;
  personas: number;
  elegido: boolean;
  onElegir: () => void;
}) {
  const { idioma, t } = useIdioma();
  const c = vuelo.condiciones;
  return (
    <article
      className={`rounded-2xl border bg-papel p-4 transition sm:p-5 dark:bg-arena-900 ${
        elegido ? "border-oliva-700 ring-1 ring-oliva-700 dark:border-oliva-300 dark:ring-oliva-300" : "border-arena-200 dark:border-arena-800"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{vuelo.aerolinea}</h3>
          <p className="text-sm text-arena-600 dark:text-arena-400">{t.vuelo.aLaIda(textoEscalas(vuelo.ida, t))}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums">{usd(vuelo.precioPorPersona, idioma)}</p>
          <p className="text-xs text-arena-600 dark:text-arena-400">
            {t.vuelo.porPersonaTotal(usd(vuelo.precioPorPersona * personas, idioma))}
          </p>
        </div>
      </header>

      <div className="mt-4 grid gap-3">
        <FilaTramo titulo={t.vuelo.ida} tramo={vuelo.ida} Icono={AirplaneTakeoff} />
        <FilaTramo titulo={t.vuelo.vuelta} tramo={vuelo.vuelta} Icono={AirplaneLanding} />
      </div>

      <details className="mt-4 rounded-xl bg-arena-50 px-3 py-2 dark:bg-arena-800/50">
        <summary className="cursor-pointer text-sm font-medium">{t.vuelo.condiciones}</summary>
        <ul className="mt-2 grid gap-1.5 pb-1 text-sm text-arena-700 dark:text-arena-300">
          <li className="flex gap-2"><Backpack size={18} className="shrink-0 text-arena-500" aria-hidden />{c.equipajeMano}</li>
          <li className="flex gap-2"><Suitcase size={18} className="shrink-0 text-arena-500" aria-hidden />{c.valija}</li>
          <li className="flex gap-2"><ArrowsClockwise size={18} className="shrink-0 text-arena-500" aria-hidden />{c.cambios}</li>
          <li className="flex gap-2"><Receipt size={18} className="shrink-0 text-arena-500" aria-hidden />{c.reembolso}</li>
        </ul>
      </details>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <EstadoDato origen={vuelo.origen} />
        <div className="flex gap-2">
          <a
            href={vuelo.linkReserva}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-arena-700 transition hover:bg-arena-100 dark:text-arena-300 dark:hover:bg-arena-800"
          >
            {t.vuelo.reservar}
            <ArrowSquareOut size={16} aria-hidden />
          </a>
          <button
            type="button"
            onClick={onElegir}
            aria-pressed={elegido}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
              elegido
                ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
                : "border border-arena-300 hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
            }`}
          >
            {elegido ? t.vuelo.elegido : t.vuelo.elegir}
          </button>
        </div>
      </footer>
    </article>
  );
}
