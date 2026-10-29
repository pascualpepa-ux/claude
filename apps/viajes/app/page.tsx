import type { Metadata } from "next";
import Link from "next/link";
import { metadatosPagina } from "@/lib/seo";
import { EnlacesIdioma } from "@/components/EnlacesIdioma";
import { ArrowRight, CloudSun, AirplaneTilt, Bed, Receipt } from "@phosphor-icons/react/dist/ssr";
import { TarjetaDia } from "@/components/TarjetaDia";
import { Marca } from "@/components/Logo";
import { EstadoDato } from "@/components/EstadoDato";
import { ViajesGuardados } from "@/components/ViajesGuardados";
import { FormularioSuscripcion } from "@/components/FormularioSuscripcion";
import { suscripcionesActivas } from "@/lib/suscripciones";
import { BellRinging } from "@phosphor-icons/react/dist/ssr";
import { ajustarDuraciones, aplicarClima, generarViaje, viajeDeMuestra } from "@/lib/mock";
import { distanciaAeropuertos } from "@/lib/lugares";
import { climaReal } from "@/lib/clima-real";
import { calcularResumen } from "@/lib/presupuesto";
import { usd } from "@/lib/dinero";
import { textosActuales } from "@/lib/idioma-servidor";
import { GUIAS } from "@/lib/guias";
import { Calificacion } from "@/components/Calificacion";
import { YOUTUBE_URL } from "@/lib/seo";
import { YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

// Las fechas de la muestra dependen del día de hoy.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, t } = await textosActuales();
  return metadatosPagina({ ruta: "/", idioma, titulo: t.meta.titulo, descripcion: t.meta.descripcion, tituloAbsoluto: true });
}

const ICONOS = { clima: CloudSun, vuelos: AirplaneTilt, hoteles: Bed };

export default async function Inicio() {
  const { idioma, t } = await textosActuales();
  const ti = t.inicio;
  // La vista previa también muestra el clima real (se guarda una hora en caché).
  const base = generarViaje(viajeDeMuestra(), idioma);
  const clima = await climaReal(
    base.ruta.map((r) => ({ iata: r.aeropuerto, fechas: base.dias.filter((d) => d.clave === r.clave).map((d) => d.fecha) })),
  );
  // Vuelo de la muestra: estimado por la distancia real entre aeropuertos (no hay aerolínea inventada).
  const plan = ajustarDuraciones(
    aplicarClima(base, clima, idioma),
    distanciaAeropuertos(base.input.aeropuertoOrigen, base.ruta[0].aeropuerto),
    distanciaAeropuertos(base.ruta.at(-1)!.aeropuerto, base.input.aeropuertoOrigen),
  );
  const resumen = calcularResumen(plan);
  const dia = plan.dias[1];
  const actividades = plan.actividades.filter((a) => dia.actividades.includes(a.id));
  const vuelo = plan.vuelos.find((v) => v.id === plan.vueloElegido)!;

  return (
    <main>
      <EnlacesIdioma ruta="/" idioma={idioma} />
      <ViajesGuardados />
      <section className="relative overflow-hidden border-b border-arena-200 bg-arena-100 dark:border-arena-800 dark:bg-arena-900">
        {/* Isotipo de la marca como marca de agua detrás de la vista previa */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-16 hidden opacity-[0.07] md:block dark:opacity-[0.06]">
          <Marca alto={560} />
        </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-20 md:pb-24">
        <div className="aparecer">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-balance text-oliva-800 md:text-5xl lg:text-6xl dark:text-arena-50">
            {ti.titulo}
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-arena-600 dark:text-arena-400">
            {ti.bajada}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planificar"
              className="inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white shadow-sm shadow-oliva-900/20 transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
            >
              {ti.planificar}
              <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <Link
              href="/viaje?ejemplo=1"
              className="inline-flex items-center rounded-xl border border-arena-300 bg-papel px-5 py-3 font-medium text-arena-900 transition hover:bg-arena-100 active:scale-[0.98] dark:border-arena-700 dark:bg-arena-900 dark:text-arena-100 dark:hover:bg-arena-800"
            >
              {ti.ejemplo}
            </Link>
          </div>
        </div>

        <div className="aparecer relative [animation-delay:120ms]" aria-label={ti.vistaPrevia}>
          <TarjetaDia numero={2} dia={dia} actividades={actividades} />
          <div className="mt-3 rounded-2xl border border-arena-200 bg-papel p-4 dark:border-arena-800 dark:bg-arena-900 md:relative md:-ml-10 md:-mt-4 md:w-72 md:shadow-lg md:shadow-arena-400/30 md:dark:shadow-black/40">
            <p className="text-sm text-arena-600 dark:text-arena-400">{ti.muestra}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(resumen.porPersona, idioma)}</p>
            <p className="text-sm text-arena-600 dark:text-arena-400">{vuelo.estimado ? ti.porPersonaEstimado : ti.porPersonaCon(vuelo.aerolinea)}</p>
          </div>
        </div>
      </div>
      </section>

      {/* Suscripción a los avisos: entre la portada y "Cada dato pasa por dos agentes". */}
      <section aria-labelledby="titulo-suscripcion" className="bg-papel dark:bg-arena-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-[1fr_minmax(0,28rem)] md:items-center md:gap-12 md:py-16">
          <div>
            <BellRinging size={32} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
            <h2 id="titulo-suscripcion" className="mt-3 max-w-[24ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {ti.suscripcionTitulo}
            </h2>
            <p className="mt-3 max-w-[52ch] text-arena-600 dark:text-arena-400">{ti.suscripcionBajada}</p>
          </div>
          <FormularioSuscripcion sinTitulo activo={suscripcionesActivas()} />
        </div>
      </section>


      {/* Guías de viaje: grandes y bien visibles, después de la suscripción. */}
      <section aria-labelledby="titulo-guias" className="border-t border-arena-200 py-16 md:py-20 dark:border-arena-800">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="titulo-guias" className="text-3xl font-semibold tracking-tight md:text-4xl">{ti.guiasTitulo}</h2>
              <p className="mt-3 max-w-[56ch] text-arena-600 dark:text-arena-400">{ti.guiasBajada}</p>
            </div>
            <Link href="/guias" className="inline-flex items-center gap-1.5 font-medium text-oliva-700 hover:underline dark:text-oliva-300">
              {ti.guiasTodas}
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIAS.slice(0, 6).map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-arena-200 bg-papel p-6 transition hover:border-oliva-600 hover:shadow-md dark:border-arena-800 dark:bg-arena-900 dark:hover:border-oliva-300"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-oliva-700 dark:text-oliva-300">{t.guias.dias(g.dias)}</span>
                  <span className="mt-2 text-xl font-semibold text-balance">{g.titulo[idioma]}</span>
                  <span className="mt-3 flex-1 text-sm text-arena-600 dark:text-arena-400">{g.descripcion[idioma]}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-oliva-700 group-hover:underline dark:text-oliva-300">
                    {t.guias.ver}
                    <ArrowRight size={14} weight="bold" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-arena-200 bg-papel py-16 md:py-24 dark:border-arena-800 dark:bg-arena-900/40">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight md:text-4xl">
            {ti.agentesTitulo}
          </h2>
          <p className="mt-4 max-w-[60ch] text-arena-600 dark:text-arena-400">
            {ti.agentesBajada}
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-[repeat(3,minmax(0,1fr))]">
            {(["clima", "vuelos", "hoteles"] as const).map((clave) => {
              const Icono = ICONOS[clave];
              const { area, busca, verifica } = ti.agentes[clave];
              return (
              <div key={clave} className="border-t-2 border-oliva-700 pt-5 dark:border-oliva-300">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Icono size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
                  {area}
                </h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium">{ti.busca}</dt>
                    <dd className="text-arena-600 dark:text-arena-400">{busca}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{ti.verifica}</dt>
                    <dd className="text-arena-600 dark:text-arena-400">{verifica}</dd>
                  </div>
                </dl>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{ti.preciosTitulo}</h2>
          <p className="mt-4 max-w-[52ch] text-arena-600 dark:text-arena-400">
            {ti.preciosBajada}
          </p>
        </div>
        <ul className="space-y-4 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
          <li className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Receipt size={18} className="text-arena-500" aria-hidden />
              {vuelo.estimado ? vuelo.aerolinea : ti.vueloCon(vuelo.aerolinea)}
            </span>
            <span className="text-sm tabular-nums">{usd(vuelo.precioPorPersona, idioma)}</span>
          </li>
          <li>
            <EstadoDato origen={vuelo.origen} />
          </li>
          <li className="border-t border-arena-100 pt-4 dark:border-arena-800">
            <EstadoDato origen={{ ...vuelo.origen, estado: "estimado" }} />
          </li>
          <li>
            <EstadoDato origen={{ ...vuelo.origen, estado: "no_verificado" }} />
          </li>
        </ul>
      </section>

      {/* Canal de YouTube: bien visible, antes de la opinión. */}
      <section aria-labelledby="titulo-youtube" className="border-t border-arena-200 dark:border-arena-800">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-start gap-6 rounded-3xl border border-arena-200 bg-papel p-6 transition hover:border-oliva-300 hover:shadow-md sm:flex-row sm:items-center md:p-8 dark:border-arena-800 dark:bg-arena-900"
          >
            <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-oliva-100 text-oliva-700 dark:bg-oliva-900/40 dark:text-oliva-300">
              <YoutubeLogo size={48} weight="fill" aria-hidden />
            </span>
            <span className="flex-1">
              <span id="titulo-youtube" className="block text-2xl font-semibold tracking-tight md:text-3xl">{ti.youtubeTitulo}</span>
              <span className="mt-2 block max-w-[60ch] text-arena-600 dark:text-arena-400">{ti.youtubeBajada}</span>
              <span className="mt-2 block text-sm font-medium text-arena-500 dark:text-arena-400">youtube.com/@rumbotraveling</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-semibold text-white transition group-hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950 dark:group-hover:bg-oliva-200">
              <YoutubeLogo size={20} weight="fill" aria-hidden />
              {ti.youtubeBoton}
            </span>
          </a>
        </div>
      </section>

      {/* Opinión: bien visible al final de la portada. */}
      <section aria-labelledby="titulo-opinion" className="border-t border-arena-200 bg-arena-100 dark:border-arena-800 dark:bg-arena-900/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-[1fr_minmax(0,28rem)] md:items-center md:gap-12 md:py-16">
          <div>
            <h2 id="titulo-opinion" className="text-3xl font-semibold tracking-tight md:text-4xl">{ti.opinionTitulo}</h2>
            <p className="mt-3 max-w-[48ch] text-arena-600 dark:text-arena-400">{ti.opinionBajada}</p>
          </div>
          <Calificacion pagina="/" titulo={t.opinion.estrellas} />
        </div>
      </section>
    </main>
  );
}
