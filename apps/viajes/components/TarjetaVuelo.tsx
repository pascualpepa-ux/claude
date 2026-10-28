"use client";

import { AirplaneTakeoff, AirplaneLanding, ArrowSquareOut, Suitcase, Backpack, ArrowsClockwise, Receipt } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import { formatoCorto, formatoDuracion, formatoHora } from "@/lib/fechas";
import { diasDespues, horaEmbarque } from "@/lib/embarque";
import type { OpcionVuelo, SegmentoVuelo, Tramo } from "@/lib/types";
import type { Textos } from "@/lib/textos";
import { EstadoDato } from "./EstadoDato";
import { useIdioma } from "./ProveedorIdioma";

function textoEscalas(tramo: Tramo, t: Textos) {
  if (tramo.escalas.length === 0) return t.vuelo.directo;
  return t.vuelo.escalas(tramo.escalas.length, tramo.escalas.join(t.vuelo.y));
}

function FilaTramo({ titulo, tramo, Icono, estimado }: { titulo: string; tramo: Tramo; Icono: React.ElementType; estimado?: boolean }) {
  const { idioma, t } = useIdioma();
  if (estimado) {
    // Vuelo estimado: solo la ruta y la duración aproximada; nada de horarios ni escalas inventadas.
    return (
      <div className="flex items-center gap-3">
        <Icono size={20} className="shrink-0 text-arena-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{titulo}</span>{" "}
            <span className="text-arena-600 dark:text-arena-400">{formatoCorto(tramo.salida.slice(0, 10), idioma)}</span>
          </p>
          <p className="text-sm tabular-nums">
            {tramo.desde} <span className="text-arena-400">{t.vuelo.a}</span> {tramo.hasta}
          </p>
        </div>
        <p className="shrink-0 text-right text-xs text-arena-600 dark:text-arena-400">
          {tramo.duracionMin ? t.vuelo.aprox(formatoDuracion(tramo.duracionMin)) : t.vuelo.sinDistancia}
        </p>
      </div>
    );
  }
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
        {tramo.numeros?.length ? (
          <p className="text-xs font-medium text-oliva-700 tabular-nums dark:text-oliva-300">{t.vuelo.numeros(tramo.numeros)}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-right text-xs text-arena-600 dark:text-arena-400">
        {formatoDuracion(tramo.duracionMin)}
        <span className="block">{textoEscalas(tramo, t)}</span>
      </p>
    </div>
  );
}

/** Cada vuelo del tramo: número, aerolínea, avión, salida, embarque, llegada, duración y la escala que sigue. */
function DetalleSegmentos({ titulo, segmentos }: { titulo: string; segmentos: SegmentoVuelo[] }) {
  const { idioma, t } = useIdioma();
  const hora = (iso: string) => formatoHora(iso, idioma);
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-arena-500 uppercase dark:text-arena-400">{titulo}</p>
      <ol className="mt-2 grid gap-2">
        {segmentos.map((s, i) => {
          const dias = diasDespues(s.salida, s.llegada);
          return (
            <li key={i}>
              <div className="rounded-lg border border-arena-200 bg-papel p-3 dark:border-arena-700 dark:bg-arena-900">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-semibold text-oliva-700 tabular-nums dark:text-oliva-300">{s.numero}</span>
                  <span className="text-arena-600 dark:text-arena-400">
                    {s.aerolinea}
                    {s.avion && ` · ${s.avion}`}
                  </span>
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-arena-500 dark:text-arena-400">{t.vuelo.sale}</dt>
                    <dd className="tabular-nums">
                      {s.desde} {hora(s.salida)}
                      <span className="block text-xs text-arena-500 dark:text-arena-400">{formatoCorto(s.salida.slice(0, 10), idioma)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-arena-500 dark:text-arena-400">{t.vuelo.embarque}</dt>
                    <dd className="tabular-nums">{hora(horaEmbarque(s.salida, s.duracionMin))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-arena-500 dark:text-arena-400">{t.vuelo.llega}</dt>
                    <dd className="tabular-nums">
                      {s.hasta} {hora(s.llegada)}
                      {dias > 0 && <span className="ml-1 text-xs font-medium whitespace-nowrap text-amber-700 dark:text-amber-400">{t.vuelo.masDias(dias)}</span>}
                    </dd>
                  </div>
                  {s.duracionMin > 0 && (
                    <div>
                      <dt className="text-xs text-arena-500 dark:text-arena-400">{t.vuelo.duracion}</dt>
                      <dd className="tabular-nums">{formatoDuracion(s.duracionMin)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              {s.escalaMin ? (
                <p className="mt-2 pl-3 text-xs text-arena-600 dark:text-arena-400">{t.vuelo.escala(s.hasta, formatoDuracion(s.escalaMin))}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
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
          <p className="max-w-[40ch] text-sm text-arena-600 dark:text-arena-400">
            {vuelo.estimado ? t.vuelo.estimadoBajada : vuelo.precioEstimado ? t.vuelo.horarioRealBajada : t.vuelo.aLaIda(textoEscalas(vuelo.ida, t))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums">{usd(vuelo.precioPorPersona, idioma)}</p>
          <p className="text-xs text-arena-600 dark:text-arena-400">
            {t.vuelo.porPersonaTotal(usd(vuelo.precioPorPersona * personas, idioma))}
          </p>
        </div>
      </header>

      <div className="mt-4 grid gap-3">
        <FilaTramo titulo={t.vuelo.ida} tramo={vuelo.ida} Icono={AirplaneTakeoff} estimado={vuelo.estimado} />
        <FilaTramo titulo={t.vuelo.vuelta} tramo={vuelo.vuelta} Icono={AirplaneLanding} estimado={vuelo.estimado} />
        {vuelo.estimado && <p className="text-xs text-arena-600 dark:text-arena-400">{t.vuelo.horariosAConfirmar}</p>}
      </div>

      {!vuelo.estimado && (vuelo.ida.segmentos?.length || vuelo.vuelta.segmentos?.length) ? (
        <details open className="mt-4 rounded-xl bg-arena-50 px-3 py-2 dark:bg-arena-800/50">
          <summary className="cursor-pointer text-sm font-medium">{t.vuelo.detalle}</summary>
          <div className="mt-2 grid gap-4 pb-2">
            {vuelo.ida.segmentos?.length ? <DetalleSegmentos titulo={t.vuelo.ida} segmentos={vuelo.ida.segmentos} /> : null}
            {vuelo.vuelta.segmentos?.length ? <DetalleSegmentos titulo={t.vuelo.vuelta} segmentos={vuelo.vuelta.segmentos} /> : null}
            <p className="text-xs text-arena-600 dark:text-arena-400">{t.vuelo.notaEmbarque}</p>
          </div>
        </details>
      ) : null}

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
            {vuelo.estimado ? t.vuelo.buscarReales : t.vuelo.reservar}
            <ArrowSquareOut size={16} aria-hidden />
          </a>
          {!vuelo.estimado && (
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
          )}
        </div>
      </footer>
    </article>
  );
}
