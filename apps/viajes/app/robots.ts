import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/seo";

// /robots.txt: Google puede leer las páginas públicas; las privadas quedan afuera.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // El viaje de ejemplo es público aunque el resto de /viaje (el viaje de cada persona) no lo sea.
        allow: ["/", "/viaje?ejemplo=1"],
        disallow: ["/admin", "/api/", "/suscripcion/", "/pausa", "/viaje"],
      },
    ],
    sitemap: `${SITIO_URL}/sitemap.xml`,
    host: SITIO_URL,
  };
}
