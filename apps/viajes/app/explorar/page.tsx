import type { Metadata } from "next";
import { GUIAS } from "@/lib/guias";
import { DESTINOS } from "@/lib/fotos-destinos";
import { UBICACIONES } from "@/lib/globo";
import { textosActuales } from "@/lib/idioma-servidor";
import { metadatosPagina } from "@/lib/seo";
import { Globo, type PuntoGlobo } from "./Globo";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma } = await textosActuales();
  return metadatosPagina({
    ruta: "/explorar",
    idioma,
    titulo: idioma === "es" ? "Explorá el mundo en 3D" : "Explore the world in 3D",
    descripcion:
      idioma === "es"
        ? "Girá el globo, tocá un destino y mirá fotos, cuánto sale por día y hoteles para reservar."
        : "Spin the globe, tap a destination and see photos, daily costs and hotels to book.",
  });
}

export default async function Explorar() {
  const { idioma } = await textosActuales();
  const puntos: PuntoGlobo[] = GUIAS.flatMap((g) => {
    const lugar = UBICACIONES[g.slug];
    const d = DESTINOS[g.slug];
    if (!lugar || !d) return [];
    return [{ slug: g.slug, nombre: d.nombre[idioma], pais: d.pais[idioma], foto: d.foto, ...lugar, dias: g.dias, porDia: g.porDia.equilibrado, descripcion: g.descripcion[idioma] }];
  });
  return (
    <main className="relative overflow-hidden bg-arena-950 bg-[radial-gradient(ellipse_at_30%_40%,rgba(90,120,80,0.35),transparent_60%)] pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 md:pt-12">
        <Globo puntos={puntos} />
      </div>
    </main>
  );
}
