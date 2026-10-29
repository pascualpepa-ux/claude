import { Gift } from "@phosphor-icons/react/dist/ssr";
import type { Idioma } from "@/lib/idioma";
import { LOCALE } from "@/lib/idioma";
import type { Participante, ResultadoSorteo } from "@/lib/sorteo";
import { BotonSortear } from "./BotonSortear";

/** Admin: quién participa del sorteo, con cuántas chances, y los sorteos hechos. */
export function PanelSorteo({ idioma, lista, hechos }: { idioma: Idioma; lista: Participante[]; hechos: ResultadoSorteo[] }) {
  const es = idioma === "es";
  const total = lista.reduce((s, p) => s + p.chances, 0);
  const cuando = (iso: string) => new Date(iso).toLocaleString(LOCALE[idioma], { dateStyle: "medium", timeStyle: "short" });
  return (
    <section aria-labelledby="titulo-sorteo" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="titulo-sorteo" className="flex items-center gap-2 font-semibold">
            <Gift size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
            {es ? "Sorteo: 3 días en Europa para 2" : "Giveaway: 3 days in Europe for 2"}
          </h2>
          <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
            {es ? `${lista.length} participantes · ${total} chances en total` : `${lista.length} entrants · ${total} chances in total`}
          </p>
        </div>
        <BotonSortear idioma={idioma} />
      </div>
      {hechos.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {hechos.map((h) => (
            <li key={h.creado} className="rounded-xl bg-oliva-50 px-4 py-3 text-sm dark:bg-oliva-900/30">
              <strong>{h.ganador}</strong> —{" "}
              {es
                ? `ganó con ${h.chances} de ${h.totalChances} chances (${h.participantes} participantes), ${cuando(h.creado)}`
                : `won with ${h.chances} of ${h.totalChances} chances (${h.participantes} entrants), ${cuando(h.creado)}`}
            </li>
          ))}
        </ul>
      )}
      {lista.length > 0 && (
        <div className="mt-4 max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-arena-600 dark:text-arena-400">
              <tr>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 text-right font-medium">{es ? "Invitó" : "Invited"}</th>
                <th className="py-2 text-right font-medium">{es ? "Chances" : "Chances"}</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.email} className="border-t border-arena-200 dark:border-arena-800">
                  <td className="py-2 break-all">{p.email}</td>
                  <td className="py-2 text-right tabular-nums">{p.invitados}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{p.chances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
