"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Plus, Trash, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { usd } from "@/lib/dinero";
import { LOCALE } from "@/lib/idioma";
import { quienDebeAQuien, saldos, type GastoCompartido } from "@/lib/gastos";
import { useIdioma } from "./ProveedorIdioma";

/** Gastos compartidos: cada uno anota lo que pagó y la web calcula quién le debe a quién. */
export function GastosCompartidos({
  viajeros,
  gastos,
  onCambiar,
}: {
  viajeros: string[];
  gastos: GastoCompartido[];
  onCambiar: (gastos: GastoCompartido[]) => void;
}) {
  const { idioma, t } = useIdioma();
  const T = t.gastos;
  const id = useId();
  const personas = viajeros.filter((v) => v.trim());
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [pagadoPor, setPagadoPor] = useState(personas[0] ?? "");
  const [entre, setEntre] = useState<string[]>(personas);
  const [error, setError] = useState<string | null>(null);

  const lista = useMemo(() => saldos(gastos, personas), [gastos, personas]);
  const pagos = useMemo(() => quienDebeAQuien(lista), [lista]);
  const total = gastos.reduce((s, g) => s + g.monto, 0);
  // Montos redondos como en el resto de la web; con centavos, con dos decimales en el formato del idioma.
  const plata = (n: number) =>
    Number.isInteger(n) ? usd(n, idioma) : new Intl.NumberFormat(LOCALE[idioma], { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(monto.replace(",", "."));
    if (!descripcion.trim()) return setError(T.faltaDescripcion);
    if (!(valor > 0)) return setError(T.faltaMonto);
    if (!entre.length) return setError(T.faltaEntre);
    setError(null);
    onCambiar([
      ...gastos,
      { id: `g${Date.now().toString(36)}`, descripcion: descripcion.trim().slice(0, 80), monto: Math.round(valor * 100) / 100, pagadoPor, entre },
    ]);
    setDescripcion("");
    setMonto("");
  };

  const caja = "rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900";
  const campo =
    "mt-1.5 w-full rounded-xl border border-arena-300 bg-papel px-3 py-2.5 text-base placeholder:text-arena-500 focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950";

  return (
    <section id="gastos" aria-labelledby="titulo-gastos" className="mt-12 scroll-mt-32">
      <h2 id="titulo-gastos" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <UsersThree size={26} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {T.titulo}
      </h2>
      <p className="mt-2 max-w-[62ch] text-arena-600 dark:text-arena-400">{T.bajada}</p>

      {personas.length < 2 ? (
        <p className={`${caja} mt-5 text-sm`}>{T.faltanViajeros}</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form onSubmit={agregar} noValidate className={caja}>
            <label htmlFor={`${id}-d`} className="block text-sm font-medium">{T.descripcion}</label>
            <input id={`${id}-d`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={80} placeholder={T.descripcionEj} className={campo} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${id}-m`} className="block text-sm font-medium">{T.monto}</label>
                <input id={`${id}-m`} inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" className={`${campo} tabular-nums`} />
              </div>
              <div>
                <label htmlFor={`${id}-p`} className="block text-sm font-medium">{T.pago}</label>
                <select id={`${id}-p`} value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)} className={campo}>
                  {personas.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">{T.entre}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {personas.map((p) => {
                  const activo = entre.includes(p);
                  return (
                    <label
                      key={p}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oliva-600/40 ${
                        activo ? "border-oliva-700 bg-oliva-700 text-white dark:border-oliva-300 dark:bg-oliva-300 dark:text-arena-950" : "border-arena-300 dark:border-arena-700"
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={activo} onChange={() => setEntre(activo ? entre.filter((x) => x !== p) : [...entre, p])} />
                      {p}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-oliva-700 px-5 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
            >
              <Plus size={16} weight="bold" aria-hidden />
              {T.agregar}
            </button>
          </form>

          <div className={caja}>
            <h3 className="font-semibold">{T.pagos}</h3>
            {gastos.length === 0 ? (
              <p className="mt-2 text-sm text-arena-600 dark:text-arena-400">{T.vacio}</p>
            ) : pagos.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-oliva-800 dark:text-oliva-200">
                <CheckCircle size={20} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
                {T.aMano}
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {pagos.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-arena-50 px-3 py-2.5 dark:bg-arena-800/60">
                    <span className="font-medium">{p.de}</span>
                    <ArrowRight size={16} weight="bold" className="shrink-0 text-arena-500" aria-hidden />
                    <span className="font-medium">{p.a}</span>
                    <span className="ml-auto font-semibold tabular-nums">{plata(p.monto)}</span>
                    <span className="sr-only">{T.deuda(p.de, p.a, plata(p.monto))}</span>
                  </li>
                ))}
              </ul>
            )}

            {gastos.length > 0 && (
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="border-b border-arena-200 text-left text-arena-600 dark:border-arena-800 dark:text-arena-400">
                    <th scope="col" className="py-2 font-medium">{T.persona}</th>
                    <th scope="col" className="py-2 text-right font-medium">{T.puso}</th>
                    <th scope="col" className="py-2 text-right font-medium">{T.leToca}</th>
                    <th scope="col" className="py-2 text-right font-medium">{T.saldo}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((s) => (
                    <tr key={s.persona} className="border-b border-arena-100 last:border-0 dark:border-arena-800">
                      <th scope="row" className="py-2 text-left font-medium">{s.persona}</th>
                      <td className="py-2 text-right tabular-nums">{plata(s.pago)}</td>
                      <td className="py-2 text-right tabular-nums">{plata(s.leToca)}</td>
                      <td className={`py-2 text-right font-semibold tabular-nums ${s.saldo > 0 ? "text-oliva-700 dark:text-oliva-300" : s.saldo < 0 ? "text-red-700 dark:text-red-400" : ""}`}>
                        {s.saldo > 0 ? `+${plata(s.saldo)}` : s.saldo < 0 ? `−${plata(-s.saldo)}` : plata(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {gastos.length > 0 && (
            <div className={`${caja} lg:col-span-2`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{T.lista}</h3>
                <p className="text-sm text-arena-600 dark:text-arena-400">
                  {T.total}: <span className="font-semibold text-arena-900 tabular-nums dark:text-arena-100">{plata(total)}</span>
                </p>
              </div>
              <ul className="mt-3 divide-y divide-arena-100 dark:divide-arena-800">
                {gastos.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{g.descripcion}</p>
                      <p className="text-xs text-arena-600 dark:text-arena-400">{T.pagoPor(g.pagadoPor, g.entre.length)}</p>
                    </div>
                    <span className="font-semibold tabular-nums">{plata(g.monto)}</span>
                    <button
                      type="button"
                      onClick={() => onCambiar(gastos.filter((x) => x.id !== g.id))}
                      aria-label={T.borrar(g.descripcion)}
                      className="grid size-9 place-items-center rounded-lg text-arena-500 transition hover:bg-arena-100 hover:text-red-700 dark:hover:bg-arena-800"
                    >
                      <Trash size={18} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-arena-500 dark:text-arena-400">{T.nota}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
