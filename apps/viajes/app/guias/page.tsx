import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { GUIAS } from "@/lib/guias";
import { usd } from "@/lib/dinero";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/guias", idioma, titulo: t.guias.metaTitulo, descripcion: t.guias.metaDescripcion, tituloAbsoluto: true });
}

export default async function Guias() {
  const { idioma, t } = await textosActuales();
  const T = t.guias;
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-20 md:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{T.titulo}</h1>
      <p className="mt-3 max-w-[60ch] text-arena-600 dark:text-arena-400">{T.bajada}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIAS.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guias/${g.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-arena-200 bg-papel p-5 transition hover:border-oliva-600 hover:shadow-sm dark:border-arena-800 dark:bg-arena-900 dark:hover:border-oliva-300"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-oliva-700 dark:text-oliva-300">{T.dias(g.dias)}</span>
              <h2 className="mt-2 text-lg font-semibold text-balance">{g.titulo[idioma]}</h2>
              <p className="mt-2 flex-1 text-sm text-arena-600 dark:text-arena-400">{g.descripcion[idioma]}</p>
              <p className="mt-4 text-sm">
                <span className="text-arena-600 dark:text-arena-400">{T.desde} </span>
                <span className="font-semibold tabular-nums">{usd(g.porDia.economico[0], idioma)}</span>
                <span className="text-arena-600 dark:text-arena-400"> {T.porPersonaDia}</span>
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-oliva-700 group-hover:underline dark:text-oliva-300">
                {T.ver}
                <ArrowRight size={14} weight="bold" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
