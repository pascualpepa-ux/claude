import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOut, CheckCircle, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { Calificacion } from "@/components/Calificacion";
import { PlanearGuia } from "@/components/PlanearGuia";
import { guiaPorSlug, relacionadas, totalViaje } from "@/lib/guias";
import { usd } from "@/lib/dinero";
import { LOCALE, type Idioma } from "@/lib/idioma";
import { textosActuales } from "@/lib/idioma-servidor";
import { buscarLugares } from "@/lib/lugares";
import { metadatosPagina, SITIO_URL, urlEnIdioma } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guiaPorSlug((await params).slug);
  if (!g) return {};
  const { idioma } = await textosActuales();
  return metadatosPagina({ ruta: `/guias/${g.slug}`, idioma, titulo: g.titulo[idioma], descripcion: g.descripcion[idioma] });
}

function mesAnio(revisado: string, idioma: Idioma) {
  const [a, m] = revisado.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[idioma], { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(a, m - 1, 1));
}

export default async function PaginaGuia({ params }: Props) {
  const g = guiaPorSlug((await params).slug);
  if (!g) notFound();
  const { idioma, t } = await textosActuales();
  const T = t.guias;

  // El destino tal como lo usa el asistente (con sus aeropuertos), para abrirlo ya completado.
  const { buscar, pais, tipo } = g.destino;
  const lugar = buscarLugares(buscar, 6, tipo === "pais").find((l) => l.pais === pais && l.tipo === tipo) ?? null;
  const nombre =
    tipo === "pais" ? (new Intl.DisplayNames([LOCALE[idioma]], { type: "region" }).of(pais) ?? buscar) : (lugar?.ciudad ?? buscar);

  const url = urlEnIdioma(`/guias/${g.slug}`, idioma);
  const datos = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: g.titulo[idioma],
        description: g.descripcion[idioma],
        inLanguage: idioma,
        url,
        dateModified: `${g.revisado}-01`,
        author: { "@type": "Organization", name: "Rumbo Traveling", url: SITIO_URL },
        publisher: { "@id": `${SITIO_URL}/#organizacion` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: T.inicio, item: urlEnIdioma("/", idioma) },
          { "@type": "ListItem", position: 2, name: T.titulo, item: urlEnIdioma("/guias", idioma) },
          { "@type": "ListItem", position: 3, name: g.titulo[idioma], item: url },
        ],
      },
    ],
  };

  const caja = "rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900";
  const estilos = ["economico", "equilibrado", "premium"] as const;

  return (
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-20 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />
      <nav aria-label="breadcrumb" className="text-sm text-arena-600 dark:text-arena-400">
        <Link href="/" className="hover:underline">{T.inicio}</Link>
        <span aria-hidden> / </span>
        <Link href="/guias" className="hover:underline">{T.titulo}</Link>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-oliva-800 md:text-5xl dark:text-arena-50">{g.titulo[idioma]}</h1>
      <p className="mt-2 text-sm text-arena-500 dark:text-arena-400">{T.revisado(mesAnio(g.revisado, idioma))}</p>
      <p className="mt-5 text-lg leading-relaxed text-arena-700 dark:text-arena-300">{g.intro[idioma]}</p>
      <div className="mt-6">
        <PlanearGuia lugar={lugar} nombre={nombre} dias={g.dias} />
      </div>

      <section aria-labelledby="itinerario" className="mt-12">
        <h2 id="itinerario" className="text-2xl font-semibold tracking-tight">{T.itinerario}</h2>
        <ol className="mt-5 space-y-4">
          {g.itinerario.map((d, i) => (
            <li key={i} className={caja}>
              <h3 className="font-semibold">{d.titulo[idioma]}</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-arena-700 marker:text-oliva-600 dark:text-arena-300">
                {d.actividades.map((a, k) => (
                  <li key={k}>{a[idioma]}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="precios" className="mt-12">
        <h2 id="precios" className="text-2xl font-semibold tracking-tight">{T.precios}</h2>
        <ul className={`${caja} mt-5 divide-y divide-arena-100 p-0 text-sm dark:divide-arena-800`}>
          {g.precios.map((p, i) => (
            <li key={i} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                {p.concepto[idioma]}
                {(p.enlace || p.verificado) && (
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-arena-500 dark:text-arena-400">
                    {p.verificado && (
                      <span className="inline-flex items-center gap-1 text-oliva-700 dark:text-oliva-300">
                        <CheckCircle size={13} weight="fill" aria-hidden />
                        {T.verificado}
                      </span>
                    )}
                    {p.enlace && (
                      <a href={p.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:underline">
                        {T.sitioOficial}
                        <ArrowSquareOut size={12} aria-hidden />
                      </a>
                    )}
                  </span>
                )}
              </div>
              <span className="max-w-[45%] text-right font-medium tabular-nums">{p.monto[idioma]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-arena-500 dark:text-arena-400">{T.aviso}</p>
      </section>

      <section aria-labelledby="presupuesto" className="mt-12">
        <h2 id="presupuesto" className="text-2xl font-semibold tracking-tight">{T.presupuesto}</h2>
        <p className="mt-2 text-arena-600 dark:text-arena-400">{T.presupuestoBajada(g.dias)}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {estilos.map((e) => {
            const [min, max] = g.porDia[e];
            const [tmin, tmax] = totalViaje(g, g.porDia[e]);
            return (
              <li key={e} className={caja}>
                <p className="font-medium">{T.estilos[e]}</p>
                <p className="mt-2 text-xs text-arena-500 dark:text-arena-400">{T.total}</p>
                <p className="text-xl font-semibold tabular-nums">{usd(tmin, idioma)}–{usd(tmax, idioma)}</p>
                <p className="mt-2 text-sm text-arena-600 tabular-nums dark:text-arena-400">
                  {T.porDia}: {usd(min, idioma)}–{usd(max, idioma)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="consejos" className="mt-12">
        <h2 id="consejos" className="text-2xl font-semibold tracking-tight">{T.consejos}</h2>
        <ul className="mt-5 space-y-3">
          {g.consejos.map((c, i) => (
            <li key={i} className="flex gap-3 text-arena-700 dark:text-arena-300">
              <Lightbulb size={20} weight="duotone" className="mt-0.5 shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
              {c[idioma]}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${caja} mt-12 bg-arena-100 dark:bg-arena-900`}>
        <h2 className="text-xl font-semibold">{T.planear}</h2>
        <p className="mt-2 text-arena-600 dark:text-arena-400">{T.planearBajada}</p>
        <div className="mt-4">
          <PlanearGuia lugar={lugar} nombre={nombre} dias={g.dias} />
        </div>
      </section>

      <div className="mt-12">
        <Calificacion pagina={`/guias/${g.slug}`} titulo={t.opinion.tituloGuia} />
      </div>

      <section aria-labelledby="relacionadas" className="mt-12">
        <h2 id="relacionadas" className="text-xl font-semibold">{T.relacionadas}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {relacionadas(g).map((r) => (
            <li key={r.slug}>
              <Link href={`/guias/${r.slug}`} className={`${caja} block h-full text-sm font-medium transition hover:border-oliva-600 dark:hover:border-oliva-300`}>
                {r.titulo[idioma]}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
