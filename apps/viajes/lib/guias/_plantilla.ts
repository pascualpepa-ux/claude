import type { Guia } from "./tipos";

/**
 * PLANTILLA para sumar una guía nueva:
 * 1. Copiá este archivo con el nombre del destino (ej. "praga-3-dias.ts") y completá cada campo en los dos idiomas.
 * 2. Agregala a la lista de lib/guias/index.ts.
 * Listo: aparece en /guias, tiene su propia página, entra al sitemap y el botón "Planear este viaje" ya funciona.
 * Los precios con `verificado: true` tienen que estar confirmados en la web oficial que va en `enlace`.
 */
export const plantilla: Guia = {
  slug: "ciudad-3-dias",
  dias: 3,
  claves: ["ciudad"],
  destino: { buscar: "Ciudad", pais: "XX", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Ciudad en 3 días", en: "What to do in City in 3 days" },
  descripcion: { es: "Resumen para Google (hasta 160 caracteres).", en: "Summary for Google (up to 160 characters)." },
  intro: { es: "Primer párrafo de la guía.", en: "First paragraph of the guide." },
  itinerario: [
    { titulo: { es: "Día 1: …", en: "Day 1: …" }, actividades: [{ es: "…", en: "…" }] },
  ],
  precios: [{ concepto: { es: "Entrada a …", en: "… ticket" }, monto: { es: "€10", en: "€10" }, enlace: "https://…", verificado: true }],
  porDia: { economico: [60, 80], equilibrado: [120, 160], premium: [300, 400] },
  consejos: [{ es: "…", en: "…" }],
};
