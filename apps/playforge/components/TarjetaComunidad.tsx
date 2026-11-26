import Link from "next/link";
import { Heart, Play, Repeat2 } from "lucide-react";
import { formatoNumero } from "@/lib/texto";
import type { ResumenComunidad } from "@/lib/comunidad";

export function TarjetaComunidad({ juego, ancho = "w-full" }: { juego: ResumenComunidad; ancho?: string }) {
  return (
    <Link href={`/comunidad/${juego.id}`} className={`group block ${ancho} shrink-0 snap-start`} prefetch={false}>
      <div className="relative overflow-hidden rounded-2xl border border-borde/60 bg-capa-2 transition duration-300 group-hover:-translate-y-1 group-hover:border-rosa/60 group-hover:shadow-lg group-hover:shadow-rosa/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/portada/${juego.id}`} alt="" width={320} height={200} loading="lazy" className="aspect-[16/10] w-full transition duration-500 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-fondo"><Play className="ml-0.5 h-5 w-5" fill="currentColor" /></span>
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-rosa px-2 py-0.5 text-[10px] font-bold uppercase text-fondo">Comunidad</span>
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold group-hover:text-rosa">{juego.titulo}</h3>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-tenue">
        <span className="truncate">por {juego.autor}</span>
        {juego.remixDe && <Repeat2 className="h-3 w-3 shrink-0" aria-label="Remix" />}
        <span className="ml-auto flex items-center gap-1"><Heart className="h-3 w-3" /> {formatoNumero(juego.likes)}</span>
      </div>
    </Link>
  );
}
