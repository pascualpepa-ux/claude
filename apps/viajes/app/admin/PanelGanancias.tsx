import { Bank, CurrencyEur } from "@phosphor-icons/react/dist/ssr";
import { GraficoVisitas } from "@/components/GraficoVisitas";
import { formatoCorto } from "@/lib/fechas";
import type { Ganancias } from "@/lib/ganancias";
import { LOCALE, type Idioma } from "@/lib/idioma";

/** Admin: lo que ganamos con los vuelos y hoteles vendidos en la web, y la cuenta bancaria donde llega. */
export function PanelGanancias({ idioma, datos, prueba, banco }: { idioma: Idioma; datos: Ganancias; prueba: boolean; banco: string | null }) {
  const es = idioma === "es";
  const dinero = (n: number) => n.toLocaleString(LOCALE[idioma], { style: "currency", currency: datos.moneda });
  const tarjeta = "rounded-2xl bg-arena-50 p-4 dark:bg-arena-950";
  return (
    <section aria-labelledby="titulo-ganancias" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 id="titulo-ganancias" className="flex items-center gap-2 font-semibold">
        <CurrencyEur size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {es ? "Lo que ganamos" : "What we earn"}
        {prueba && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">{es ? "Modo prueba: no es plata real" : "Test mode: not real money"}</span>}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={`${tarjeta} sm:col-span-1`}>
          <p className="text-sm text-arena-600 dark:text-arena-400">{es ? "Ganado (comisiones)" : "Earned (commissions)"}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-oliva-800 dark:text-oliva-200">{dinero(datos.ganado)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-sm text-arena-600 dark:text-arena-400">{es ? "Ventas" : "Sales"}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{datos.ventas}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-sm text-arena-600 dark:text-arena-400">{es ? "Cobrado a clientes" : "Charged to customers"}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-arena-700 dark:text-arena-300">{dinero(datos.cobrado)}</p>
        </div>
      </div>

      <div className={`${tarjeta} mt-3 flex items-start gap-3`}>
        <Bank size={24} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
        <div>
          <p className="font-medium">{es ? "Cuenta bancaria" : "Bank account"}</p>
          <p className="text-sm text-arena-600 dark:text-arena-400">
            {banco ??
              (es
                ? "Sin conectar. Se conecta en Stripe (a nombre de un adulto): ahí llega lo que pagan los clientes, y tu ganancia queda en esa cuenta."
                : "Not connected. It's connected in Stripe (in an adult's name): customer payments arrive there and your earnings stay in that account.")}
          </p>
        </div>
      </div>

      {datos.ganado > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold">{es ? "Ganancia por día (últimos 30 días)" : "Earnings per day (last 30 days)"}</h3>
          <GraficoVisitas
            puntos={datos.porDia.map((d) => ({ clave: d.dia, etiqueta: formatoCorto(d.dia, idioma), valor: d.ganado }))}
            descripcion={es ? "Ganancia por día en los últimos 30 días" : "Earnings per day in the last 30 days"}
            columnaEtiqueta={es ? "Día" : "Day"}
            cadaEtiqueta={{ angosto: 14, ancho: 7 }}
            columnaValor={es ? "Ganado" : "Earned"}
            moneda={datos.moneda}
          />
        </div>
      )}

      {datos.ultimas.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-arena-600 dark:text-arena-400">
              <tr>
                <th className="py-2 font-medium">{es ? "Reserva" : "Booking"}</th>
                <th className="py-2 text-right font-medium">{es ? "Cobrado" : "Charged"}</th>
                <th className="py-2 text-right font-medium">{es ? "Ganado" : "Earned"}</th>
              </tr>
            </thead>
            <tbody>
              {datos.ultimas.map((u) => (
                <tr key={u.codigo + u.creado} className="border-t border-arena-200 dark:border-arena-800">
                  <td className="py-2">
                    <span className="mr-1">{u.tipo === "vuelo" ? "✈️" : "🏨"}</span>
                    {u.ruta} <span className="font-mono text-xs text-arena-500">{u.codigo}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{dinero(u.precio)}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-oliva-800 dark:text-oliva-200">{dinero(u.ganado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
