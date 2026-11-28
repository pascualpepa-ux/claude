import Link from "next/link";
import { Car, ChevronRight } from "lucide-react";
import { coches } from "@/lib/catalogo/consultas";
import { MOTORES } from "@/lib/catalogo/motores";
import { urlPortada } from "@/lib/portadas";

const FOTOS: Record<string, string> = { fuga: "Persecuciones", carreras: "Turbo 3D", montana: "Subidas", derrape: "Derrapes", estacionar: "Estacionar" };

/** Bloque destacado de la portada: los juegos de coches primero. */
export function ZonaCoches() {
  const categorias = MOTORES.filter((m) => m.generos.includes("coches"));
  return (
    <section className="relative mx-4 mt-6 overflow-hidden rounded-[28px] border border-cian/30 bg-gradient-to-br from-cian/15 via-capa-1 to-rosa/10 p-5 sm:mx-6 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-cian/20 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cian"><Car className="h-4 w-4" /> Zona de coches</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Juegos de coches</h2>
          <p className="mt-1 text-sm text-tenue">Carreras en 3D, subidas de montaña, derrapes contra rivales y estacionamiento. Más de {(categorias.length * 1080).toLocaleString("es")} juegos.</p>
        </div>
        <Link href="/coches" className="flex items-center gap-1 rounded-xl bg-cian px-4 py-2.5 text-sm font-bold text-fondo transition hover:scale-[1.03]">Ver todos <ChevronRight className="h-4 w-4" /></Link>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {categorias.map((m) => {
          const j = coches(1, "puntuacion", m.id)[0];
          return (
            <Link key={m.id} href={`/coches#${m.id}`} className="group relative overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlPortada(j.id)} alt="" width={320} height={200} loading="lazy" className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="font-extrabold leading-tight">{m.nombre}</p>
                <p className="text-xs text-white/70">{FOTOS[m.id] ?? "Coches"} · 1.080 juegos</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
