"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ticket } from "@phosphor-icons/react/dist/ssr";
import type { FilaAdminReserva } from "@/lib/agentes-reservas";
import { LOCALE, type Idioma } from "@/lib/idioma";

const ESTADO = {
  esperando_pago: { es: "Sin pagar", en: "Unpaid", clase: "bg-arena-100 text-arena-700 ring-arena-300 dark:bg-arena-800 dark:text-arena-300 dark:ring-arena-700" },
  emitida: { es: "Hecha", en: "Done", clase: "bg-oliva-50 text-oliva-800 ring-oliva-200 dark:bg-oliva-950/60 dark:text-oliva-300 dark:ring-oliva-900" },
  pendiente: { es: "En curso", en: "In progress", clase: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900" },
  fallida: { es: "Falló", en: "Failed", clase: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900" },
};

/** Admin: todas las compras (vuelos y hoteles), con botón para cancelar. */
export function ListaReservas({ filas, idioma }: { filas: FilaAdminReserva[]; idioma: Idioma }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const es = idioma === "es";
  const dinero = (n: string | number, m: string) => Number(n).toLocaleString(LOCALE[idioma], { style: "currency", currency: m });
  const cancelar = async (f: FilaAdminReserva) => {
    if (!confirm(es ? `¿Cancelar ${f.codigo} (${f.ruta})? Se cancela con la ${f.tipo === "vuelo" ? "aerolínea" : "hotel"} y le avisamos al cliente.` : `Cancel ${f.codigo}?`)) return;
    setOcupado(f.id);
    const r = await fetch("/api/admin/reservas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: f.id }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setAviso(r?.ok ? (es ? `Cancelada. Devolución: ${j.devolucion > 0 ? dinero(j.devolucion, j.moneda || f.moneda) : "sin devolución (tarifa no reembolsable)"}.` : "Cancelled.") : es ? "No se pudo cancelar." : "Couldn't cancel.");
    setOcupado(null);
    router.refresh();
  };
  return (
    <section aria-labelledby="titulo-reservas-admin" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 id="titulo-reservas-admin" className="flex items-center gap-2 font-semibold">
        <Ticket size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {es ? "Reservas" : "Bookings"} <span className="text-sm font-normal text-arena-500">({filas.length})</span>
      </h2>
      {aviso && <p role="status" className="mt-3 rounded-xl bg-arena-100 px-3 py-2 text-sm dark:bg-arena-800">{aviso}</p>}
      {filas.length === 0 ? (
        <p className="mt-3 text-sm text-arena-600 dark:text-arena-400">{es ? "Todavía no hay reservas." : "No bookings yet."}</p>
      ) : (
        <div className="mt-3 max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-arena-600 dark:text-arena-400">
              <tr>
                <th className="py-2 font-medium">{es ? "Reserva" : "Booking"}</th>
                <th className="py-2 font-medium">{es ? "Estado" : "Status"}</th>
                <th className="py-2 text-right font-medium">{es ? "Ganado" : "Earned"}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const e = ESTADO[f.estado];
                return (
                  <tr key={f.id} className="border-t border-arena-200 align-top dark:border-arena-800">
                    <td className="py-2 pr-2">
                      <span className="mr-1">{f.tipo === "vuelo" ? "✈️" : "🏨"}</span>
                      {f.ruta}
                      <span className="block text-xs text-arena-500">
                        <span className="font-mono">{f.codigo ?? "—"}</span> · {f.email} · {new Date(f.creado).toLocaleDateString(LOCALE[idioma])}
                        {f.prueba && (es ? " · prueba" : " · test")}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${f.cancelada ? "bg-arena-100 text-arena-700 ring-arena-300 dark:bg-arena-800 dark:text-arena-300" : e.clase}`}>
                        {f.cancelada ? (es ? "Cancelada" : "Cancelled") : e[idioma]}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{f.estado === "emitida" && !f.cancelada ? dinero(Number(f.precio) - Number(f.costo), f.moneda) : "—"}</td>
                    <td className="py-2 pl-2 text-right">
                      {f.estado === "emitida" && !f.cancelada && (
                        <button type="button" disabled={ocupado === f.id} onClick={() => cancelar(f)} className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40">
                          {ocupado === f.id ? "…" : es ? "Cancelar" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
