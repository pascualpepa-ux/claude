import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reproductor } from "@/components/Reproductor";
import { infoReproductor } from "@/lib/catalogo/info";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const info = infoReproductor((await params).id);
  return { title: info ? `Jugando ${info.juego.nombre}` : "Juego", robots: { index: false }, alternates: info ? { canonical: `/juego/${info.juego.id}` } : undefined };
}

export default async function Jugar({ params }: P) {
  const info = infoReproductor((await params).id);
  if (!info) notFound();
  return <Reproductor key={info.juego.id} info={info} />;
}
