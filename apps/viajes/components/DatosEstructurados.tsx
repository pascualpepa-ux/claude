import type { Idioma } from "@/lib/idioma";
import { SITIO_URL, YOUTUBE_URL } from "@/lib/seo";
import { TEXTOS } from "@/lib/textos";

/**
 * Datos estructurados (schema.org, JSON-LD) para que Google entienda qué es Rumbo:
 * el sitio, quién lo hace y que es una aplicación web gratuita de viajes.
 */
export function DatosEstructurados({ idioma }: { idioma: Idioma }) {
  const t = TEXTOS[idioma].meta;
  const datos = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITIO_URL}/#organizacion`,
        name: "Rumbo Traveling",
        url: SITIO_URL,
        logo: { "@type": "ImageObject", url: `${SITIO_URL}/marca/icono-512.png`, width: 512, height: 512 },
        email: "info@rumbotraveling.com",
        founder: { "@type": "Person", name: "Pascual Pepa" },
        sameAs: [YOUTUBE_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITIO_URL}/#sitio`,
        name: "Rumbo Traveling",
        alternateName: "Rumbo",
        url: SITIO_URL,
        description: t.descripcion,
        inLanguage: ["es", "en"],
        publisher: { "@id": `${SITIO_URL}/#organizacion` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITIO_URL}/#app`,
        name: "Rumbo Traveling",
        url: SITIO_URL,
        description: t.descripcion,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        inLanguage: ["es", "en"],
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList:
          idioma === "en"
            ? ["Day-by-day itinerary", "Flights and hotels", "Real weather forecast", "Per-person budget", "Shared trip expenses", "Trip change notifications"]
            : ["Itinerario día por día", "Vuelos y hoteles", "Pronóstico del clima real", "Presupuesto por persona", "Gastos compartidos del viaje", "Avisos de cambios en el viaje"],
        publisher: { "@id": `${SITIO_URL}/#organizacion` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON propio (sin datos de la gente): se escapa "<" para que no pueda cerrar la etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
