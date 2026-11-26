import type { MetadataRoute } from "next";
import { publicados } from "@/lib/catalogo/consultas";
import { NOMBRE_GENERO } from "@/lib/catalogo/tipos";
import { SITIO_URL } from "@/lib/sitio";

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const fijas = ["", "/coches", "/explorar", "/crear", "/desafio", "/comunidad"].map((r) => ({ url: `${SITIO_URL}${r}`, changeFrequency: "daily" as const, priority: r === "" ? 1 : 0.8 }));
  const generos = Object.keys(NOMBRE_GENERO).map((g) => ({ url: `${SITIO_URL}/explorar?genero=${g}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  const juegos = publicados().map((j) => ({ url: `${SITIO_URL}/juego/${j.id}`, lastModified: j.lanzamiento, changeFrequency: "monthly" as const, priority: 0.5 }));
  return [...fijas, ...generos, ...juegos];
}
