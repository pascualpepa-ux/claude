"use client";

import { CheckCircle, WarningCircle, Info } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import type { Resumen } from "@/lib/presupuesto";
import { useIdioma } from "./ProveedorIdioma";

export function ResumenPresupuesto({ resumen }: { resumen: Resumen }) {
  const { idioma, t } = useIdioma();
  const p = t.presupuesto;
  const { rango } = resumen;
  const etiquetaRango = rango.modo === "persona" ? p.porPersonaCorto : p.grupo;
  const $ = (n: number) => usd(n, idioma);
  return (
    <section
      id="presupuesto"
      aria-labelledby="titulo-presupuesto"
      className="rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900"
    >
      <h2 id="titulo-presupuesto" className="text-sm font-medium text-arena-600 dark:text-arena-400">
        {p.total}
      </h2>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{$(resumen.total)}</p>
      <p className="text-sm text-arena-600 dark:text-arena-400">
        {p.porPersona($(resumen.porPersona), resumen.personas)}
      </p>

      {rango.max > 0 && (
        <div
          role="status"
          className={`mt-4 flex gap-2 rounded-xl px-3 py-2.5 text-sm ${
            rango.estado === "excedido"
              ? "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
              : rango.estado === "debajo"
                ? "bg-arena-100 text-arena-700 dark:bg-arena-800 dark:text-arena-300"
                : "bg-oliva-50 text-oliva-800 dark:bg-oliva-950/50 dark:text-oliva-300"
          }`}
        >
          {rango.estado === "excedido" ? (
            <WarningCircle size={20} weight="fill" className="shrink-0" aria-hidden />
          ) : rango.estado === "debajo" ? (
            <Info size={20} className="shrink-0" aria-hidden />
          ) : (
            <CheckCircle size={20} weight="fill" className="shrink-0" aria-hidden />
          )}
          <p>
            {rango.estado === "excedido" && p.excedido($(rango.diferencia), $(rango.max), etiquetaRango)}
            {rango.estado === "debajo" && p.debajo($(rango.diferencia), $(rango.min), etiquetaRango)}
            {rango.estado === "dentro" && p.dentro(rango.min > 0 ? $(rango.min) : null, $(rango.max), etiquetaRango)}
          </p>
        </div>
      )}

      <dl className="mt-5 grid gap-3">
        {resumen.lineas.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_auto] gap-x-3">
            <dt className="text-sm font-medium">{l.concepto}</dt>
            <dd className="text-right text-sm tabular-nums">
              {$(l.monto)}
            </dd>
            <dd className="col-span-2 text-xs text-arena-500 dark:text-arena-400">
              {l.detalle}
              {l.estado !== "verificado" && `. ${p.estimado}`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
