import type { Metadata } from "next";
import Link from "next/link";
import { Car, Gauge, Play, Trophy } from "lucide-react";
import { coches, desafioCoches } from "@/lib/catalogo/consultas";
import { MOTORES } from "@/lib/catalogo/motores";
import { DIFICULTADES } from "@/lib/catalogo/tipos";
import { urlPortada } from "@/lib/portadas";
import { ANCHO_TARJETA, Fila } from "@/components/Fila";
import { TarjetaJuego } from "@/components/TarjetaJuego";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { TarjetaEspecial } from "@/components/TarjetaEspecial";
import { ESPECIALES } from "@/lib/catalogo/especiales";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Juegos de coches gratis",
  description: "Más de 4.000 juegos de coches gratis en el navegador: carreras en 3D, subidas de montaña con física, derrapes contra rivales y estacionamiento. En celular y computadora.",
  alternates: { canonical: "/coches" },
};

export default function Coches() {
  const desafio = desafioCoches();
  const motores = MOTORES.filter((m) => m.generos.includes("coches"));
  const motorDesafio = MOTORES.find((m) => m.id === desafio.motor)!;
  return (
    <div className="mx-auto max-w-[1500px] pb-8">
      <section className="relative mx-4 mt-4 overflow-hidden rounded-[28px] border border-cian/30 sm:mx-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlPortada(desafio.id)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-fondo via-fondo/85 to-fondo/30" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cian"><Car className="h-4 w-4" /> Zona de coches</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Juegos de coches</h1>
            <p className="mt-3 max-w-lg text-tenue">{(motores.length * 1080).toLocaleString("es")} juegos para pisar el acelerador: carreras en 3D, cerros con física real, circuitos con derrapes y maniobras de estacionamiento.</p>
            <div className="mt-6 rounded-2xl border border-ambar/30 bg-capa-1/80 p-4 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ambar"><Trophy className="h-3.5 w-3.5" /> Desafío de coches del día · termina en <CuentaRegresiva className="text-texto" /></p>
              <p className="mt-1 text-lg font-bold">{desafio.nombre}</p>
              <p className="text-sm text-tenue">{motorDesafio.nombre} · {motorDesafio.modos[desafio.modo].nombre} · {DIFICULTADES[desafio.dificultad]}</p>
              <Link href={`/jugar/${desafio.id}`} className="mt-3 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-cian to-marca px-6 font-extrabold transition hover:scale-[1.03]"><Play className="h-5 w-5" fill="currentColor" /> Acelerar</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPortada(desafio.id)} alt={`Portada de ${desafio.nombre}`} width={640} height={400} fetchPriority="high" className="hidden w-full rounded-3xl border border-white/10 shadow-2xl lg:block" />
        </div>
      </section>

      <div className="mx-4 mt-6 sm:mx-6"><TarjetaEspecial juego={ESPECIALES[0]} /></div>
      <nav className="sin-scroll mx-4 mt-6 flex gap-2 overflow-x-auto sm:mx-6" aria-label="Tipos de juegos de coches">
        {motores.map((m) => <a key={m.id} href={`#${m.id}`} className="shrink-0 rounded-full border border-borde bg-capa-1 px-4 py-2 text-sm font-medium hover:border-cian">{m.nombre}</a>)}
      </nav>

      <Fila titulo="Los mejores juegos de coches" icono={<Gauge className="h-5 w-5 text-cian" />}>
        {coches(18).map((j, i) => <TarjetaJuego key={j.id} juego={j} prioridad={i < 4} ancho={ANCHO_TARJETA} />)}
      </Fila>
      <Fila titulo="Nuevos juegos de coches" verTodo="/explorar?genero=coches&orden=nuevo">
        {coches(18, "nuevo").map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
      {motores.map((m) => (
        <div key={m.id} id={m.id} className="scroll-mt-24">
          <Fila titulo={m.nombre} subtitulo={m.modos.map((x) => x.nombre).join(" · ")} verTodo={`/explorar?motor=${m.id}`}>
            {coches(16, "popular", m.id).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
          </Fila>
        </div>
      ))}
      <Fila titulo="Coches para jugar de a uno, rápido" subtitulo="Partidas cortas">
        {coches(60, "popular").filter((j) => j.duracion === "corta").slice(0, 16).map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
    </div>
  );
}
