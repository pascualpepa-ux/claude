import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { formatoCorto } from "@/lib/fechas";
import type { Idioma } from "@/lib/idioma";
import type { FilaSuscriptor } from "@/lib/suscripciones";
import type { Textos } from "@/lib/textos";

const COLOR_ESTADO = {
  activo: "bg-oliva-50 text-oliva-800 ring-oliva-200 dark:bg-oliva-950/60 dark:text-oliva-300 dark:ring-oliva-900",
  pendiente: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
  baja: "bg-arena-100 text-arena-700 ring-arena-300 dark:bg-arena-800 dark:text-arena-300 dark:ring-arena-700",
};

/** Admin: todas las personas suscriptas, con su estado, idioma, viajes y cómo salió el último email. */
export function ListaSuscriptores({
  filas,
  estado,
  idioma,
  T,
}: {
  filas: FilaSuscriptor[];
  estado: "ok" | "sin_base" | "error";
  idioma: Idioma;
  T: Textos["admin"]["suscriptores"];
}) {
  const fecha = (iso: string) => formatoCorto(iso.slice(0, 10), idioma);
  const cuenta = (e: FilaSuscriptor["estado"]) => filas.filter((f) => f.estado === e).length;
  return (
    <section aria-labelledby="titulo-suscriptores" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 id="titulo-suscriptores" className="flex items-center gap-2 font-semibold">
        <UsersThree size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {T.titulo}
      </h2>
      {estado === "sin_base" && <p className="mt-3 text-sm text-arena-600 dark:text-arena-400">{T.sinBase}</p>}
      {estado === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
          {T.error}
        </p>
      )}
      {estado === "ok" && (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {(
              [
                [T.activos, cuenta("activo")],
                [T.pendientes, cuenta("pendiente")],
                [T.bajas, cuenta("baja")],
              ] as const
            ).map(([etiqueta, n]) => (
              <div key={etiqueta} className="rounded-xl bg-arena-50 px-3 py-2 dark:bg-arena-800/60">
                <dt className="text-xs text-arena-600 dark:text-arena-400">{etiqueta}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          {filas.length === 0 ? (
            <p className="mt-4 text-sm text-arena-600 dark:text-arena-400">{T.vacio}</p>
          ) : (
            <div className="mt-4 -mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-arena-500 dark:text-arena-400">
                    <th className="py-2 pr-3 font-medium">{T.email}</th>
                    <th className="py-2 pr-3 font-medium">{T.estado}</th>
                    <th className="py-2 pr-3 font-medium">{T.idioma}</th>
                    <th className="py-2 pr-3 font-medium">{T.desde}</th>
                    <th className="py-2 pr-3 font-medium">{T.viajes}</th>
                    <th className="py-2 font-medium">{T.ultimoEmail}</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.email} className="border-t border-arena-100 align-top dark:border-arena-800">
                      <td className="py-2 pr-3 font-medium break-all">
                        <a href={`mailto:${f.email}`} className="hover:underline">
                          {f.email}
                        </a>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${COLOR_ESTADO[f.estado]}`}>
                          {T.estados[f.estado]}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{T.idiomas[f.idioma]}</td>
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{fecha(new Date(f.confirmado ?? f.creado).toISOString())}</td>
                      <td className="py-2 pr-3">{f.viajes.length ? f.viajes.join(", ") : T.ninguno}</td>
                      <td className="py-2 whitespace-nowrap">
                        {f.ultimo_envio ? `${T.entrega[f.ultimo_estado ?? ""] ?? f.ultimo_estado} · ${fecha(new Date(f.ultimo_envio).toISOString())}` : T.ninguno}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-arena-500 dark:text-arena-400">{T.aviso}</p>
        </>
      )}
    </section>
  );
}
