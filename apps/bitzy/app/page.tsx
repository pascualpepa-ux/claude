import Link from "next/link";
import { Car, Clock, Flame, Gamepad2, Play, Sparkles, Star, TrendingUp, Trophy, Users, Wand2 } from "lucide-react";
import { coches, desafioDelDia, destacado, masJugados, nuevos, porGenero, tendencias } from "@/lib/catalogo/consultas";
import { totalJuegos } from "@/lib/catalogo/generador";
import { MOTORES } from "@/lib/catalogo/motores";
import { NOMBRE_GENERO, type Genero } from "@/lib/catalogo/tipos";
import { listarComunidad } from "@/lib/comunidad";
import { urlPortada } from "@/lib/portadas";
import { formatoNumero } from "@/lib/texto";
import { ANCHO_TARJETA, Fila } from "@/components/Fila";
import { TarjetaJuego } from "@/components/TarjetaJuego";
import { TarjetaComunidad } from "@/components/TarjetaComunidad";
import { FilaPersonal } from "@/components/FilaPersonal";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { BotonAzar } from "@/components/BotonAzar";
import { Estrellas } from "@/components/Estrellas";
import { ZonaCoches } from "@/components/ZonaCoches";

export const revalidate = 1800;

const GENEROS_PORTADA: Genero[] = ["carreras", "plataformas", "disparos", "puzzles", "ritmo", "defensa", "deportes", "snake", "corredores", "multijugador"];

export default async function Inicio() {
  const hero = destacado();
  const desafio = desafioDelDia();
  const comunidad = await listarComunidad(16);
  const motorHero = MOTORES.find((m) => m.id === hero.motor)!;

  return (
    <div className="mx-auto max-w-[1500px] pb-6">
      {/* Destacado */}
      <section className="relative mx-4 mt-4 overflow-hidden rounded-[28px] border border-borde/70 sm:mx-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlPortada(hero.id)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-fondo via-fondo/85 to-fondo/30" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:p-14">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cian/40 bg-cian/15 px-3 py-1 text-xs font-semibold text-cian"><Flame className="h-3.5 w-3.5" /> Coche destacado de hoy</span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{hero.nombre}</h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-base text-tenue sm:line-clamp-none sm:text-lg">{hero.descripcion}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tenue">
              <span className="flex items-center gap-1.5"><Estrellas valor={hero.estrellas} /> <span className="font-semibold text-texto">{hero.estrellas.toFixed(1)}</span></span>
              <span className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" /> {formatoNumero(hero.partidas)} partidas</span>
              <span className="rounded-full bg-capa-3 px-2.5 py-0.5 text-xs">{NOMBRE_GENERO[hero.generos[0]]}</span>
              <span className="rounded-full bg-capa-3 px-2.5 py-0.5 text-xs">{motorHero.modos[hero.modo].nombre}</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/jugar/${hero.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-bold text-fondo shadow-xl shadow-white/10 transition hover:scale-[1.03] active:scale-95">
                <Play className="h-5 w-5" fill="currentColor" /> Jugar ahora
              </Link>
              <Link href={`/juego/${hero.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-borde bg-capa-2/70 px-6 py-3.5 font-semibold backdrop-blur transition hover:bg-capa-3">Más info</Link>
            </div>
          </div>
          <Link href={`/jugar/${hero.id}`} className="group relative order-1 block lg:order-2" aria-label={`Jugar ${hero.nombre}`}>
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-marca/40 to-cian/30 opacity-60 blur-2xl transition group-hover:opacity-90" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPortada(hero.id)} alt={`Portada de ${hero.nombre}`} width={640} height={400} fetchPriority="high" className="relative aspect-[16/10] w-full rounded-3xl border border-white/10 shadow-2xl transition duration-500 group-hover:scale-[1.02]" />
          </Link>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="mx-4 mt-6 grid gap-4 sm:mx-6 md:grid-cols-3">
        <Link href="/desafio" className="group relative overflow-hidden rounded-3xl border border-ambar/30 bg-gradient-to-br from-ambar/15 via-capa-1 to-capa-1 p-5 transition hover:border-ambar/60">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPortada(desafio.id)} alt="" width={128} height={80} className="h-20 w-32 shrink-0 rounded-xl border border-white/10 object-cover" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ambar"><Trophy className="h-3.5 w-3.5" /> Desafío del día</p>
              <h2 className="mt-1 truncate font-bold">{desafio.nombre}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-tenue"><Clock className="h-3.5 w-3.5" /> Termina en <CuentaRegresiva className="font-semibold text-texto" /></p>
            </div>
          </div>
        </Link>
        <Link href="/crear" className="group relative overflow-hidden rounded-3xl border border-marca/30 bg-gradient-to-br from-marca/20 via-capa-1 to-capa-1 p-5 transition hover:border-marca/60">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-marca-2"><Wand2 className="h-3.5 w-3.5" /> Creador con IA</p>
          <h2 className="mt-1 font-bold">Hacé tu propio juego charlando</h2>
          <p className="mt-1 text-sm text-tenue">Describilo, jugalo al instante y publicalo para todos.</p>
          <Sparkles className="absolute -right-2 -top-2 h-20 w-20 text-marca/20 transition duration-500 group-hover:rotate-12 group-hover:text-marca/30" />
        </Link>
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-borde bg-capa-1 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rosa">¿No sabés qué jugar?</p>
            <p className="mt-1 text-sm text-tenue">{totalJuegos().toLocaleString("es")} juegos, una ruleta.</p>
          </div>
          <BotonAzar className="w-full" />
        </div>
      </section>

      <ZonaCoches />
      <Fila titulo="Juegos de coches" icono={<Car className="h-5 w-5 text-cian" />} subtitulo="Los mejor puntuados" verTodo="/coches">
        {coches(18).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
      <Fila titulo="Tendencias" icono={<TrendingUp className="h-5 w-5 text-rosa" />} verTodo="/explorar?orden=popular">
        {tendencias(16).map((j, i) => <TarjetaJuego key={j.id} juego={j} prioridad={i < 4} ancho={ANCHO_TARJETA} />)}
      </Fila>
      <FilaPersonal />
      <Fila titulo="Nuevos" icono={<Sparkles className="h-5 w-5 text-lima" />} verTodo="/explorar?orden=nuevo">
        {nuevos(16).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
      <Fila titulo="Más jugados" icono={<Gamepad2 className="h-5 w-5 text-cian" />} verTodo="/explorar?orden=popular">
        {masJugados(16).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
      <Fila titulo="Hechos por la comunidad" icono={<Users className="h-5 w-5 text-rosa" />} subtitulo="Creados con el Creador con IA" verTodo="/comunidad">
        {comunidad.map((j) => <TarjetaComunidad key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
        <Link href="/crear" className={`${ANCHO_TARJETA} grid shrink-0 snap-start place-items-center rounded-2xl border border-dashed border-borde text-center text-sm text-tenue transition hover:border-marca hover:text-texto`}>
          <span className="p-6"><Wand2 className="mx-auto mb-2 h-6 w-6" />Creá el tuyo</span>
        </Link>
      </Fila>
      {GENEROS_PORTADA.map((g) => (
        <Fila key={g} titulo={NOMBRE_GENERO[g]} icono={<Star className="h-5 w-5 text-ambar" />} verTodo={`/explorar?genero=${g}`}>
          {porGenero(g, 14).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
        </Fila>
      ))}
    </div>
  );
}
