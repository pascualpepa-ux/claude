import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reproductor } from "@/components/Reproductor";
import { infoReproductor } from "@/lib/catalogo/info";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const info = infoReproductor((await params).id);
  return { title: info?.juego.nombre ?? "Juego", robots: { index: false } };
}

/** Versión para insertar en otras webs (iframe). */
export default async function Embed({ params }: P) {
  const info = infoReproductor((await params).id);
  if (!info) notFound();
  return <Reproductor info={info} embebido />;
}
