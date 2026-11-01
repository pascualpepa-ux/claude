import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AirplaneTilt, ArrowLeft, ArrowRight, Bed, Globe } from "@phosphor-icons/react/dist/ssr";
import { HoraLocal } from "@/components/HoraLocal";
import { IconoClima } from "@/components/IconoClima";
import { condicionWmo } from "@/lib/clima-real";
import { climaAhora } from "@/lib/globo";
import { GUIAS } from "@/lib/guias";
import { LOCALE } from "@/lib/idioma";
import { textosActuales } from "@/lib/idioma-servidor";
import { bandera, nombresDe, nombrePais, paisPorCodigo } from "@/lib/paises";
import { resumenWikipedia } from "@/lib/wikipedia";

type Props = { params: Promise<{ codigo: string }> };

// Una guía corta por país, armada con datos abiertos. No aparece en la lista de guías ni en Google:
// se llega tocando el país en el globo de /explorar.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = paisPorCodigo((await params).codigo);
  if (!p) return {};
  const { idioma } = await textosActuales();
  const nombre = nombrePais(p.codigo, idioma);
  return {
    title: idioma === "es" ? `${nombre}: clima, datos y viaje` : `${nombre}: weather, facts and travel`,
    robots: { index: false, follow: true },
  };
}

const T = {
  es: {
    volver: "Volver al globo",
    climaEn: (c: string) => `Ahora en ${c}`,
    horaLocal: "hora de allá",
    sinClima: "El clima no está disponible en este momento.",
    capital: "Capital",
    idiomas: "Idioma",
    moneda: "Moneda",
    prefijo: "Prefijo telefónico",
    aeropuerto: "Aeropuerto principal",
    sobre: (n: string) => `Sobre ${n}`,
    fuente: "Fuente: Wikipedia (CC BY-SA)",
    guias: "Nuestras guías",
    viajar: "Viajá",
    hoteles: (c: string) => `Hoteles en ${c}`,
    vuelos: "Buscar vuelos",
    asistente: "Preguntale al Asistente de viajes (arriba) y te arma el viaje con precios reales.",
    visa: "Antes de viajar, revisá los requisitos de entrada y visa en la web oficial del país o de tu consulado.",
    datos: "Datos: mledoze/countries (ODbL), GeoNames, OurAirports. Clima: Open-Meteo.",
  },
  en: {
    volver: "Back to the globe",
    climaEn: (c: string) => `Now in ${c}`,
    horaLocal: "local time",
    sinClima: "Weather isn't available right now.",
    capital: "Capital",
    idiomas: "Language",
    moneda: "Currency",
    prefijo: "Calling code",
    aeropuerto: "Main airport",
    sobre: (n: string) => `About ${n}`,
    fuente: "Source: Wikipedia (CC BY-SA)",
    guias: "Our guides",
    viajar: "Travel",
    hoteles: (c: string) => `Hotels in ${c}`,
    vuelos: "Search flights",
    asistente: "Ask the Travel assistant (at the top) and it plans the trip with real prices.",
    visa: "Before you travel, check entry and visa requirements on the country's or your consulate's official website.",
    datos: "Data: mledoze/countries (ODbL), GeoNames, OurAirports. Weather: Open-Meteo.",
  },
};

const fechaEn = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

export default async function PaginaPais({ params }: Props) {
  const p = paisPorCodigo((await params).codigo);
  if (!p) notFound();
  const { idioma } = await textosActuales();
  const t = T[idioma];
  const nombre = nombrePais(p.codigo, idioma);
  const [[clima], resumen] = await Promise.all([climaAhora([p]), resumenWikipedia(nombre, idioma)]);
  const guias = GUIAS.filter((g) => g.destino.pais === p.codigo);
  const reservas = process.env.NEXT_PUBLIC_RESERVAS === "1" && !!p.aeropuerto;
  const capital = p.capital || nombre;

  const datos = [
    [t.capital, p.capital],
    [t.idiomas, nombresDe(p.idiomas, "language", idioma).join(", ")],
    [t.moneda, nombresDe(p.monedas, "currency", idioma).map((n, i) => `${n} (${p.monedas[i]})`).join(", ")],
    [t.prefijo, p.prefijo],
    [t.aeropuerto, p.aeropuerto],
  ].filter(([, v]) => v);

  return (
    <main className="pb-20">
      <section className="relative overflow-hidden bg-arena-950 text-white">
        {resumen?.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resumen.imagen} alt="" className="absolute inset-0 size-full object-cover opacity-35 blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-arena-950 via-arena-950/60 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-10 md:pt-12">
          <Link href="/explorar" className="inline-flex items-center gap-1.5 text-sm text-arena-300 hover:text-white">
            <ArrowLeft size={16} aria-hidden /> {t.volver}
          </Link>
          <p className="mt-6 text-6xl" aria-hidden>
            {bandera(p.codigo)}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">{nombre}</h1>
          <div className="mt-6 inline-flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
            {clima ? (
              <>
                <span className="grid size-14 place-items-center rounded-xl bg-white">
                  <IconoClima condicion={condicionWmo(clima.codigo)} size={40} />
                </span>
                <span>
                  <span className="block text-sm text-arena-300">{t.climaEn(capital)}</span>
                  <span className="block text-3xl leading-tight font-bold tabular-nums">{clima.temperatura}°C</span>
                  <span className="block text-sm text-arena-300">
                    <HoraLocal zona={clima.zona} locale={LOCALE[idioma]} /> {t.horaLocal}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-sm text-arena-300">{t.sinClima}</span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-4xl gap-8 px-4 pt-10 md:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          {resumen && (
            <section>
              <h2 className="text-2xl font-semibold tracking-tight">{t.sobre(nombre)}</h2>
              <p className="mt-3 leading-relaxed text-arena-700 dark:text-arena-300">{resumen.texto}</p>
              <a href={resumen.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-arena-500 hover:underline">
                {t.fuente}
              </a>
            </section>
          )}
          {guias.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold tracking-tight">{t.guias}</h2>
              <ul className="mt-3 grid gap-3">
                {guias.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guias/${g.slug}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-arena-200 bg-papel p-4 transition hover:border-oliva-600 dark:border-arena-800 dark:bg-arena-900">
                      <span className="font-semibold">{g.titulo[idioma]}</span>
                      <ArrowRight size={18} className="shrink-0 text-oliva-700 group-hover:translate-x-0.5 dark:text-oliva-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-2xl bg-oliva-50 p-5 dark:bg-oliva-950/30">
            <h2 className="text-xl font-semibold">{t.viajar}</h2>
            {reservas && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/reservar?tipo=hotel&destino=${p.aeropuerto}&entrada=${fechaEn(30)}&salida=${fechaEn(34)}&adultos=2`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-oliva-700 px-4 py-3 font-semibold text-oliva-800 transition hover:bg-white dark:border-oliva-300 dark:text-oliva-200 dark:hover:bg-arena-900"
                >
                  <Bed size={20} aria-hidden /> {t.hoteles(capital)}
                </Link>
                <Link href="/reservar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-oliva-700 px-4 py-3 font-semibold text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950">
                  <AirplaneTilt size={20} aria-hidden /> {t.vuelos}
                </Link>
              </div>
            )}
            <p className="mt-3 text-sm text-arena-700 dark:text-arena-300">{t.asistente}</p>
          </section>
        </div>

        <aside className="space-y-4">
          <dl className="divide-y divide-arena-200 rounded-2xl border border-arena-200 bg-papel dark:divide-arena-800 dark:border-arena-800 dark:bg-arena-900">
            {datos.map(([k, v]) => (
              <div key={k} className="px-4 py-3">
                <dt className="text-xs font-medium tracking-wide text-arena-500 uppercase">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-arena-500">{t.visa}</p>
          <p className="flex items-start gap-1.5 text-xs text-arena-500">
            <Globe size={14} className="mt-0.5 shrink-0" aria-hidden /> {t.datos}
          </p>
        </aside>
      </div>
    </main>
  );
}
