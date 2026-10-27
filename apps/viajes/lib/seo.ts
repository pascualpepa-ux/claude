import type { Metadata } from "next";
import { IDIOMAS, type Idioma } from "./idioma";

// SEO: direcciones por idioma, hreflang y vista previa al compartir.
// Cada página existe en español (sin parámetro) y en inglés (?lang=en). El middleware lee ?lang.

export const SITIO_URL = "https://rumbotraveling.com";
export const PARAM_IDIOMA = "lang";
export const HEADER_IDIOMA = "x-rumbo-idioma";
export const IDIOMA_PRINCIPAL: Idioma = "es";

/** Dirección absoluta de una ruta en un idioma: /planificar -> https://rumbotraveling.com/planificar?lang=en */
export function urlEnIdioma(ruta: string, idioma: Idioma) {
  const url = new URL(ruta, SITIO_URL);
  if (idioma !== IDIOMA_PRINCIPAL) url.searchParams.set(PARAM_IDIOMA, idioma);
  return url.toString();
}

/** Canonical + hreflang de una página pública. x-default apunta a la versión en español. */
export function alternativas(ruta: string, idioma: Idioma): Metadata["alternates"] {
  return {
    canonical: urlEnIdioma(ruta, idioma),
    languages: {
      ...Object.fromEntries(IDIOMAS.map((i) => [i === "es" ? "es" : "en", urlEnIdioma(ruta, i)])),
      "x-default": urlEnIdioma(ruta, IDIOMA_PRINCIPAL),
    },
  };
}

const IMAGEN = { es: "/og/rumbo-es.png", en: "/og/rumbo-en.png" } as const;

/** Título, descripción, hreflang y vista previa (Open Graph y Twitter) de una página pública. */
export function metadatosPagina(opts: { ruta: string; idioma: Idioma; titulo: string; descripcion: string; tituloAbsoluto?: boolean }): Metadata {
  const { ruta, idioma, titulo, descripcion } = opts;
  const imagen = { url: IMAGEN[idioma], width: 1200, height: 630, alt: titulo };
  // Next.js borra el "?lang=en" de las direcciones de la portada ("/"): ahí las pone <EnlacesIdioma>.
  const esPortada = ruta === "/";
  return {
    title: opts.tituloAbsoluto ? { absolute: titulo } : titulo,
    description: descripcion,
    ...(!esPortada && { alternates: alternativas(ruta, idioma) }),
    openGraph: {
      type: "website",
      siteName: "Rumbo Traveling",
      ...(!esPortada && { url: urlEnIdioma(ruta, idioma) }),
      title: titulo,
      description: descripcion,
      locale: idioma === "en" ? "en_US" : "es_AR",
      alternateLocale: idioma === "en" ? ["es_AR"] : ["en_US"],
      images: [imagen],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, images: [imagen.url] },
  };
}

/** Páginas que no tienen que aparecer en Google. */
export const NO_INDEXAR: Metadata["robots"] = { index: false, follow: false, nocache: true };
