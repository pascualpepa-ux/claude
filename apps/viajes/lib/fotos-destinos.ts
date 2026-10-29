import type { Idioma } from "./idioma";

// Nombre corto y foto de cada guía para las tarjetas de la portada.
// Fotos de Unsplash (licencia de Unsplash: uso libre, también comercial), guardadas en public/fotos.
// Bariloche no tiene foto propia: su tarjeta va con los colores de la marca, sin una foto de otro lugar.

export const DESTINOS: Record<string, { nombre: Record<Idioma, string>; pais: Record<Idioma, string>; foto?: string }> = {
  "roma-3-dias": { nombre: { es: "Roma", en: "Rome" }, pais: { es: "Italia", en: "Italy" }, foto: "/fotos/roma-3-dias.jpg" },
  "paris-4-dias": { nombre: { es: "París", en: "Paris" }, pais: { es: "Francia", en: "France" }, foto: "/fotos/paris-4-dias.jpg" },
  "barcelona-3-dias": { nombre: { es: "Barcelona", en: "Barcelona" }, pais: { es: "España", en: "Spain" }, foto: "/fotos/barcelona-3-dias.jpg" },
  "madrid-3-dias": { nombre: { es: "Madrid", en: "Madrid" }, pais: { es: "España", en: "Spain" }, foto: "/fotos/madrid-3-dias.jpg" },
  "lisboa-3-dias": { nombre: { es: "Lisboa", en: "Lisbon" }, pais: { es: "Portugal", en: "Portugal" }, foto: "/fotos/lisboa-3-dias.jpg" },
  "londres-4-dias": { nombre: { es: "Londres", en: "London" }, pais: { es: "Reino Unido", en: "United Kingdom" }, foto: "/fotos/londres-4-dias.jpg" },
  "nueva-york-5-dias": { nombre: { es: "Nueva York", en: "New York" }, pais: { es: "Estados Unidos", en: "United States" }, foto: "/fotos/nueva-york-5-dias.jpg" },
  "miami-4-dias": { nombre: { es: "Miami", en: "Miami" }, pais: { es: "Estados Unidos", en: "United States" }, foto: "/fotos/miami-4-dias.jpg" },
  "cancun-5-dias": { nombre: { es: "Cancún", en: "Cancún" }, pais: { es: "México", en: "Mexico" }, foto: "/fotos/cancun-5-dias.jpg" },
  "punta-cana-5-dias": { nombre: { es: "Punta Cana", en: "Punta Cana" }, pais: { es: "República Dominicana", en: "Dominican Republic" }, foto: "/fotos/punta-cana-5-dias.jpg" },
  "rio-de-janeiro-4-dias": { nombre: { es: "Río de Janeiro", en: "Rio de Janeiro" }, pais: { es: "Brasil", en: "Brazil" }, foto: "/fotos/rio-de-janeiro-4-dias.jpg" },
  "japon-7-dias-cuanto-cuesta": { nombre: { es: "Japón", en: "Japan" }, pais: { es: "Asia", en: "Asia" }, foto: "/fotos/japon-7-dias-cuanto-cuesta.jpg" },
  "pekin-5-dias": { nombre: { es: "Pekín", en: "Beijing" }, pais: { es: "China", en: "China" }, foto: "/fotos/pekin-5-dias.jpg" },
  "bariloche-4-dias": { nombre: { es: "Bariloche", en: "Bariloche" }, pais: { es: "Argentina", en: "Argentina" } },
};
