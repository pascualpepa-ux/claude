import type { Metadata } from "next";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { reservaParaCancelar } from "@/lib/agentes-reservas";
import { dbConfigurada } from "@/lib/db";
import { BotonCancelar } from "./BotonCancelar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cancelar reserva | Rumbo Traveling", robots: { index: false, follow: false } };

export default async function Cancelar({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const r = t && /^[\w-]{20,60}$/.test(t) && dbConfigurada() ? await reservaParaCancelar(t).catch(() => null) : null;
  const caja = "mx-auto max-w-lg px-4 py-16";
  if (!r || r.estado !== "emitida") {
    return (
      <main className={caja}>
        <h1 className="text-2xl font-semibold">No encontramos esa reserva</h1>
        <p className="mt-3 text-arena-600 dark:text-arena-400">Revisá el link del email o escribinos a info@rumbotraveling.com.</p>
      </main>
    );
  }
  const d = r.detalle;
  const sinDevolucion = d?.tipo === "hotel" && !d.reembolsable;
  const aviso = sinDevolucion
    ? "Esta tarifa NO es reembolsable: si cancelás, no se devuelve nada. ¿Cancelar igual?"
    : "¿Seguro que querés cancelar? La devolución depende de la tarifa de la aerolínea o del hotel.";
  return (
    <main className={caja}>
      <h1 className="text-2xl font-semibold">Cancelar reserva</h1>
      <div className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
        <p className="text-sm text-arena-600 dark:text-arena-400">Código de reserva</p>
        <p className="text-2xl font-bold tracking-widest">{r.codigo}</p>
        <p className="mt-3">{r.ruta}</p>
        <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
          Pagaste {Number(r.precio).toFixed(2)} {r.moneda}
        </p>
      </div>
      {r.cancelada ? (
        <p className="mt-6 font-medium text-oliva-800 dark:text-oliva-200">Esta reserva ya está cancelada.</p>
      ) : (
        <>
          <p className={`mt-6 flex gap-2 rounded-xl px-4 py-3 text-sm ${sinDevolucion ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300" : "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"}`}>
            <WarningCircle size={20} weight="fill" className="shrink-0" aria-hidden />
            {sinDevolucion ? "Esta tarifa no es reembolsable: si cancelás, no se devuelve nada." : "Lo que se devuelve depende de la tarifa. Te lo confirmamos por email."}
          </p>
          <div className="mt-6">
            <BotonCancelar token={t!} aviso={aviso} />
          </div>
        </>
      )}
    </main>
  );
}
