import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, Gauge, Keyboard, Map as MapIcon, Palette, Play, Smartphone, Timer, Users } from "lucide-react";
import { masJugados, similares } from "@/lib/catalogo/consultas";
import { juegoPorId, temaDe } from "@/lib/catalogo/generador";
import { MOTORES } from "@/lib/catalogo/motores";
import { DIFICULTADES, NOMBRE_DURACION, NOMBRE_GENERO } from "@/lib/catalogo/tipos";
import { urlPortada } from "@/lib/portadas";
import { SITIO_URL } from "@/lib/sitio";
import { formatoNumero } from "@/lib/texto";
import { Estrellas } from "@/components/Estrellas";
import { TarjetaJuego } from "@/components/TarjetaJuego";
import { BotonCompartir, BotonFavorito, RecordPersonal } from "@/components/AccionesJuego";

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return masJugados(150).map((j) => ({ id: j.id }));
}

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = juegoPorId((await params).id);
  if (!j) return { title: "Juego no encontrado" };
  const desc = j.descripcion.slice(0, 160);
  return {
    title: `${j.nombre} — Jugá gratis online`,
    description: desc,
    alternates: { canonical: `/juego/${j.id}` },
    openGraph: { title: j.nombre, description: desc, type: "website", url: `/juego/${j.id}` },
    twitter: { card: "summary_large_image", title: j.nombre, description: desc },
  };
}

export default async function PaginaJuego({ params }: P) {
  const j = juegoPorId((await params).id);
  if (!j) notFound();
  const motor = MOTORES.find((m) => m.id === j.motor)!;
  const tema = temaDe(j);
  const parecidos = similares(j, 12);
  const datos = [
    { icono: Gamepad2, et: "Género", v: j.generos.map((g) => NOMBRE_GENERO[g]).join(", ") },
    { icono: Gauge, et: "Dificultad", v: DIFICULTADES[j.dificultad] },
    { icono: MapIcon, et: "Modo", v: motor.modos[j.modo].nombre },
    { icono: Palette, et: "Temática", v: tema.nombre },
    { icono: Timer, et: "Duración", v: NOMBRE_DURACION[j.duracion] },
    { icono: Users, et: "Jugadores", v: j.multijugador === "local" ? "1 o 2 (mismo dispositivo)" : "1" },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: j.nombre,
    description: j.descripcion,
    url: `${SITIO_URL}/juego/${j.id}`,
    image: `${SITIO_URL}/juego/${j.id}/opengraph-image`,
    genre: j.generos.map((g) => NOMBRE_GENERO[g]),
    gamePlatform: ["Navegador web", "Android", "iOS", "PC"],
    applicationCategory: "Game",
    operatingSystem: "Cualquiera",
    datePublished: j.lanzamiento,
    inLanguage: "es",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: j.estrellas, ratingCount: Math.max(5, Math.round(j.partidas / 40)), bestRating: 5 },
  };

  return (
    <div className="mx-auto max-w-[1300px] px-4 pb-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="pt-5 text-sm text-tenue" aria-label="Ruta">
        <Link href="/explorar" className="hover:text-texto">Explorar</Link> <span className="mx-1">/</span>
        <Link href={`/explorar?genero=${j.generos[0]}`} className="hover:text-texto">{NOMBRE_GENERO[j.generos[0]]}</Link>
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <Link href={`/jugar/${j.id}`} className="group relative block overflow-hidden rounded-3xl border border-borde shadow-2xl" aria-label={`Jugar ${j.nombre}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPortada(j.id)} alt={`Portada de ${j.nombre}`} width={800} height={500} fetchPriority="high" className="aspect-[16/10] w-full transition duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 grid place-items-center bg-black/30 transition group-hover:bg-black/45">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-fondo shadow-2xl transition duration-300 group-hover:scale-110"><Play className="ml-1 h-9 w-9" fill="currentColor" /></span>
          </div>
        </Link>
        <div>
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{j.nombre}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tenue">
            <span className="flex items-center gap-1.5"><Estrellas valor={j.estrellas} tam="h-4 w-4" /> <strong className="text-texto">{j.estrellas.toFixed(1)}</strong></span>
            <span>{formatoNumero(j.partidas)} partidas</span>
            <span>Publicado el {new Date(`${j.lanzamiento}T12:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <p className="mt-4 leading-relaxed text-tenue">{j.descripcion}</p>
          <Link href={`/jugar/${j.id}`} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-marca to-cian text-lg font-extrabold shadow-xl shadow-marca/30 transition hover:scale-[1.02] hover:shadow-marca/50 active:scale-[0.98]">
            <Play className="h-6 w-6" fill="currentColor" /> Jugar
          </Link>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotonFavorito id={j.id} />
            <BotonCompartir ruta={`/juego/${j.id}`} titulo={j.nombre} rutaEmbed={`/embed/${j.id}`} />
          </div>
          <div className="mt-5 rounded-2xl border border-borde bg-capa-1 p-4"><RecordPersonal id={j.id} /></div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="rounded-3xl border border-borde bg-capa-1 p-6">
          <h2 className="text-lg font-bold">Ficha del juego</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {datos.map(({ icono: I, et, v }) => (
              <div key={et} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-capa-3"><I className="h-5 w-5 text-marca-2" /></span>
                <div><dt className="text-xs uppercase tracking-wider text-tenue">{et}</dt><dd className="font-medium">{v}</dd></div>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-tenue"><strong className="text-texto">Modo {motor.modos[j.modo].nombre}:</strong> {motor.modos[j.modo].descripcion}</p>
        </section>
        <section className="rounded-3xl border border-borde bg-capa-1 p-6">
          <h2 className="text-lg font-bold">Cómo se juega</h2>
          <p className="mt-4 flex items-start gap-3 text-sm"><Keyboard className="mt-0.5 h-5 w-5 shrink-0 text-cian" /> {motor.controles}</p>
          <p className="mt-3 flex items-start gap-3 text-sm"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-lima" /> {motor.controlesTactiles}</p>
          <p className="mt-4 text-sm text-tenue">La dificultad sube a medida que avanzás. Cada vez que abrís este juego es exactamente el mismo: mismos mapas, mismas reglas. ¡Ideal para batir tu récord!</p>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Juegos similares</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {parecidos.map((x) => <TarjetaJuego key={x.id} juego={x} />)}
        </div>
      </section>
    </div>
  );
}
