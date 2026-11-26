import type { Metadata } from "next";
import { Explorador } from "@/components/Explorador";
import type { Filtros, Orden } from "@/lib/catalogo/consultas";
import { NOMBRE_GENERO, type Duracion, type Genero } from "@/lib/catalogo/tipos";

type Params = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const s = await searchParams;
  const g = s.genero && s.genero in NOMBRE_GENERO ? NOMBRE_GENERO[s.genero as Genero] : null;
  return {
    title: g ? `Juegos de ${g.toLowerCase()} gratis` : s.q ? `Resultados para «${s.q}»` : "Explorar más de 14.000 juegos gratis",
    description: g ? `Jugá cientos de juegos de ${g.toLowerCase()} gratis en el navegador, en celular o computadora.` : "Buscá entre más de 14.000 juegos gratis: filtrá por género, duración, dificultad y multijugador.",
    alternates: { canonical: g ? `/explorar?genero=${s.genero}` : "/explorar" },
  };
}

export default async function Explorar({ searchParams }: { searchParams: Params }) {
  const s = await searchParams;
  const inicial: Filtros = {
    q: s.q ?? "",
    genero: (s.genero as Genero) || "",
    duracion: (s.duracion as Duracion) || "",
    dificultad: s.dificultad != null && s.dificultad !== "" ? Number(s.dificultad) : null,
    multijugador: s.multijugador === "1",
    movil: s.movil === "1",
    orden: (s.orden as Orden) || "popular",
    motor: s.motor || undefined,
  };
  return <Explorador key={JSON.stringify(inicial)} inicial={inicial} />;
}
