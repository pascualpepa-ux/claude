import { IDIOMAS, type Idioma } from "@/lib/idioma";
import { IDIOMA_PRINCIPAL, urlEnIdioma } from "@/lib/seo";

/**
 * Canonical, hreflang y og:url escritos a mano (React los lleva al <head>).
 * Se usa en la portada porque Next.js, para la ruta "/", descarta el "?lang=en" de esas direcciones.
 */
export function EnlacesIdioma({ ruta, idioma }: { ruta: string; idioma: Idioma }) {
  return (
    <>
      <link rel="canonical" href={urlEnIdioma(ruta, idioma)} />
      {IDIOMAS.map((i) => (
        <link key={i} rel="alternate" hrefLang={i} href={urlEnIdioma(ruta, i)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={urlEnIdioma(ruta, IDIOMA_PRINCIPAL)} />
      <meta property="og:url" content={urlEnIdioma(ruta, idioma)} />
    </>
  );
}
