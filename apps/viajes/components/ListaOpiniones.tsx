import { ChatCenteredText, Star } from "@phosphor-icons/react/dist/ssr";
import { formatoCorto } from "@/lib/fechas";
import type { Idioma } from "@/lib/idioma";
import type { Categoria } from "@/lib/clasificar-opinion";
import type { Opinion } from "@/lib/opiniones";
import type { Textos } from "@/lib/textos";

const COLOR: Record<Categoria, string> = {
  problema: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  mejora: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  elogio: "bg-oliva-100 text-oliva-800 dark:bg-oliva-900 dark:text-oliva-100",
  comentario: "bg-arena-100 text-arena-700 dark:bg-arena-800 dark:text-arena-200",
  sin_texto: "bg-arena-100 text-arena-600 dark:bg-arena-800 dark:text-arena-300",
};

/** Admin: promedio, reparto por estrellas y últimas opiniones. */
export function ListaOpiniones({
  datos,
  idioma,
  T,
}: {
  datos: { total: number; promedio: number; porEstrellas: Record<number, number>; porCategoria: Partial<Record<Categoria, number>>; ultimas: Opinion[] } | null;
  idioma: Idioma;
  T: Textos["admin"]["opiniones"];
}) {
  if (!datos) return null;
  const numero = (n: number) => n.toLocaleString(idioma === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 1 });
  const max = Math.max(1, ...Object.values(datos.porEstrellas));
  return (
    <section aria-labelledby="titulo-opiniones" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 id="titulo-opiniones" className="flex items-center gap-2 font-semibold">
        <ChatCenteredText size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {T.titulo}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-arena-50 px-3 py-2 dark:bg-arena-800/60">
            <dt className="text-xs text-arena-600 dark:text-arena-400">{T.promedio}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{datos.total ? T.de5(numero(datos.promedio)) : "—"}</dd>
          </div>
          <div className="rounded-xl bg-arena-50 px-3 py-2 dark:bg-arena-800/60">
            <dt className="text-xs text-arena-600 dark:text-arena-400">{T.total}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{datos.total}</dd>
          </div>
        </dl>
        <ul className="grid gap-1 text-sm" aria-label={T.titulo}>
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n} className="flex items-center gap-2">
              <span className="flex w-10 items-center gap-0.5 tabular-nums">
                {n} <Star size={14} weight="fill" className="text-amber-500" aria-hidden />
              </span>
              <span className="h-2 flex-1 rounded-full bg-arena-100 dark:bg-arena-800">
                <span className="block h-2 rounded-full bg-oliva-600 dark:bg-oliva-300" style={{ width: `${((datos.porEstrellas[n] ?? 0) / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums">{datos.porEstrellas[n] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
      {datos.total > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs">
          {(Object.keys(T.categorias) as Categoria[]).map((c) => (
            <li key={c} className={`rounded-full px-2.5 py-1 ${COLOR[c]}`}>
              {T.categorias[c]}: <span className="font-semibold tabular-nums">{datos.porCategoria[c] ?? 0}</span>
            </li>
          ))}
        </ul>
      )}
      {datos.ultimas.length === 0 ? (
        <p className="mt-4 text-sm text-arena-600 dark:text-arena-400">{T.vacio}</p>
      ) : (
        <ul className="mt-4 divide-y divide-arena-100 dark:divide-arena-800">
          {datos.ultimas.map((o, i) => (
            <li key={i} className="py-3 text-sm">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-amber-500" aria-label={`${o.estrellas}/5`}>
                  {"★".repeat(o.estrellas)}
                  <span className="text-arena-300 dark:text-arena-600">{"★".repeat(5 - o.estrellas)}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${COLOR[o.categoria]}`}>
                  {T.categorias[o.categoria]}
                  {o.prioridad === "alta" && ` · ${T.prioridad.alta}`}
                </span>
                <span className="text-arena-500 dark:text-arena-400">
                  {o.pagina} · {o.idioma.toUpperCase()} · {formatoCorto(new Date(o.creada).toISOString().slice(0, 10), idioma)}
                </span>
              </p>
              <p className={`mt-1 whitespace-pre-wrap ${o.comentario ? "" : "text-arena-500 dark:text-arena-400"}`}>{o.comentario || T.sinComentario}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-arena-500 dark:text-arena-400">{T.aviso}</p>
    </section>
  );
}
