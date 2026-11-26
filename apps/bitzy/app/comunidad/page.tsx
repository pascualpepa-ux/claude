import type { Metadata } from "next";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { listarComunidad } from "@/lib/comunidad";
import { TarjetaComunidad } from "@/components/TarjetaComunidad";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hechos por la comunidad", description: "Juegos creados por la comunidad de Bitzy con el Creador con IA. Jugalos, dales like y hacé tu propio remix.", alternates: { canonical: "/comunidad" } };

export default async function Comunidad() {
  const juegos = await listarComunidad(120);
  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hechos por la comunidad</h1>
          <p className="mt-1 text-tenue">{juegos.length} juegos creados con IA por jugadores como vos.</p>
        </div>
        <Link href="/crear" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-marca to-cian px-5 py-3 font-bold"><Wand2 className="h-5 w-5" /> Crear el mío</Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {juegos.map((j) => <TarjetaComunidad key={j.id} juego={j} />)}
      </div>
    </div>
  );
}
