import { CheckCircle, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import type { Idioma } from "@/lib/idioma";
import type { Mensaje } from "@/lib/mensajes";
import type { Textos } from "@/lib/textos";

/** Admin: mensajes de clientes (formulario de contacto y emails recibidos), con la respuesta automática que se les mandó. */
export function ListaMensajes({ mensajes, idioma, T }: { mensajes: Mensaje[] | null; idioma: Idioma; T: Textos["admin"]["mensajes"] }) {
  if (!mensajes) return null;
  const fecha = (iso: string) =>
    new Intl.DateTimeFormat(idioma === "es" ? "es-AR" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(iso));
  return (
    <section aria-labelledby="titulo-mensajes" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 id="titulo-mensajes" className="flex items-center gap-2 font-semibold">
        <EnvelopeSimple size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {T.titulo}
        <span className="rounded-full bg-arena-100 px-2 py-0.5 text-xs font-medium tabular-nums dark:bg-arena-800">{mensajes.length}</span>
      </h2>
      {mensajes.length === 0 ? (
        <p className="mt-3 text-sm text-arena-600 dark:text-arena-400">{T.vacio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-arena-100 dark:divide-arena-800">
          {mensajes.map((m, i) => (
            <li key={i} className="py-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p>
                  <span className="font-semibold">{m.nombre || m.email}</span>
                  {m.nombre && <span className="text-arena-600 dark:text-arena-400"> · {m.email}</span>}
                </p>
                <p className="text-xs text-arena-500 dark:text-arena-400">
                  {m.origen === "formulario" ? T.formulario : T.email} · {m.idioma.toUpperCase()} · {fecha(m.creado)}
                </p>
              </div>
              {m.asunto && <p className="mt-1 font-medium">{m.asunto}</p>}
              <p className="mt-1.5 whitespace-pre-wrap text-arena-800 dark:text-arena-200">{m.texto}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {m.respuesta_automatica && (
                  <span className="inline-flex items-center gap-1 text-oliva-700 dark:text-oliva-300">
                    <CheckCircle size={14} weight="fill" aria-hidden />
                    {T.respondido}
                  </span>
                )}
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(m.asunto ? `Re: ${m.asunto}` : "Rumbo Traveling")}`}
                  className="font-medium text-oliva-700 hover:underline dark:text-oliva-300"
                >
                  {T.responder}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-arena-500 dark:text-arena-400">{T.aviso}</p>
    </section>
  );
}
