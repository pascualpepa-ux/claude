import Link from "next/link";
import { Play, Star, Users } from "lucide-react";
import { urlPortada } from "@/lib/portadas";
import { formatoNumero, hoyUTC, sumarDias } from "@/lib/texto";
import { NOMBRE_GENERO, type Juego } from "@/lib/catalogo/tipos";

export function TarjetaJuego({ juego, prioridad = false, ancho = "w-full" }: { juego: Juego; prioridad?: boolean; ancho?: string }) {
  const nuevo = juego.lanzamiento >= sumarDias(hoyUTC(), -21);
  return (
    <Link href={`/juego/${juego.id}`} className={`group block ${ancho} shrink-0 snap-start outline-none`} prefetch={false}>
      <div className="relative overflow-hidden rounded-2xl border border-borde/60 bg-capa-2 shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-marca/60 group-hover:shadow-marca/20 group-focus-visible:ring-4 group-focus-visible:ring-marca/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlPortada(juego.id)}
          alt=""
          width={320}
          height={200}
          loading={prioridad ? "eager" : "lazy"}
          decoding="async"
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-12 w-12 scale-75 place-items-center rounded-full bg-white text-fondo shadow-xl transition duration-300 group-hover:scale-100"><Play className="ml-0.5 h-5 w-5" fill="currentColor" /></span>
        </div>
        <div className="absolute left-2 top-2 flex gap-1.5">
          {nuevo && <span className="rounded-full bg-lima px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fondo">Nuevo</span>}
          {juego.multijugador !== "no" && <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold backdrop-blur"><Users className="h-3 w-3" /> 2J</span>}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="truncate text-sm font-semibold leading-tight transition-colors group-hover:text-marca-2">{juego.nombre}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-tenue">
          <span className="truncate">{NOMBRE_GENERO[juego.generos[0]]}</span>
          <span className="flex items-center gap-0.5 text-ambar"><Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />{juego.estrellas.toFixed(1)}</span>
          <span className="ml-auto shrink-0">{formatoNumero(juego.partidas)}</span>
        </div>
      </div>
    </Link>
  );
}

export function TarjetaEsqueleto() {
  return (
    <div className="w-full">
      <div className="esqueleto aspect-[16/10] rounded-2xl" />
      <div className="esqueleto mt-2 h-3.5 w-3/4 rounded" />
      <div className="esqueleto mt-1.5 h-3 w-1/2 rounded" />
    </div>
  );
}
