import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { DESTINOS } from "@/lib/fotos-destinos";
import { GUIAS } from "@/lib/guias";
import type { Idioma } from "@/lib/idioma";
import { PORTADA } from "@/lib/textos-portada";

/** Destinos con foto: las guías como tarjetas grandes, la primera más grande. */
export function Destinos({ idioma }: { idioma: Idioma }) {
  const P = PORTADA[idioma];
  const guias = GUIAS.filter((g) => DESTINOS[g.slug]).slice(0, 9);
  return (
    <section aria-labelledby="titulo-destinos" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titulo-destinos" className="text-3xl font-semibold tracking-tight md:text-4xl">{P.destinosTitulo}</h2>
            <p className="mt-3 max-w-[56ch] text-arena-600 dark:text-arena-400">{P.destinosBajada}</p>
          </div>
          <Link href="/guias" className="inline-flex items-center gap-1.5 font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            {P.todas}
            <ArrowRight size={16} weight="bold" aria-hidden />
          </Link>
        </div>
        <ul className="mt-8 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guias.map((g, i) => {
            const d = DESTINOS[g.slug];
            return (
              <li key={g.slug} className={i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="group relative flex h-full overflow-hidden rounded-3xl bg-oliva-800 text-white shadow-sm focus-visible:outline-offset-4"
                >
                  {d.foto ? (
                    <Image
                      src={d.foto}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 50vw, (min-width: 640px) 100vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
                      className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  ) : (
                    <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-oliva-500),var(--color-oliva-900))]" />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <span className="relative mt-auto block p-5">
                    <span className="flex items-center gap-1 text-xs font-medium tracking-wide text-white/85 uppercase">
                      <MapPin size={14} weight="fill" aria-hidden />
                      {d.pais[idioma]} · {P.dias(g.dias)}
                    </span>
                    <span className={`mt-1 block font-semibold tracking-tight ${i === 0 ? "text-4xl md:text-5xl" : "text-2xl"}`}>{d.nombre[idioma]}</span>
                    <span className="mt-1 block text-sm text-white/90">{P.desde(g.porDia.economico[0])}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-arena-500">{P.fotos}</p>
      </div>
    </section>
  );
}
