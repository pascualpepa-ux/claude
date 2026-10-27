import type { Guia } from "./tipos";

export const barcelona: Guia = {
  slug: "barcelona-3-dias",
  dias: 3,
  claves: ["barcelona","sagrada familia","park guell","gaudi"],
  destino: { buscar: "Barcelona", pais: "ES", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Barcelona en 3 días", en: "What to do in Barcelona in 3 days" },
  descripcion: {
    es: "Itinerario de 3 días en Barcelona: Sagrada Família, Park Güell, Gótico, Born y playa, con precios de entradas verificados y consejos.",
    en: "A 3-day Barcelona itinerary: Sagrada Família, Park Güell, the Gothic Quarter, El Born and the beach, with verified ticket prices and tips.",
  },
  intro: {
    es: "Barcelona mezcla Gaudí, barrios medievales y mar. En tres días ves las obras principales, caminás el centro histórico y te queda tiempo para la playa y Montjuïc.",
    en: "Barcelona mixes Gaudí, medieval streets and the sea. In three days you see the main works, walk the old town and still have time for the beach and Montjuïc.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: Gaudí", en: "Day 1: Gaudí" },
      actividades: [
        { es: "Sagrada Família (entrada con horario).", en: "Sagrada Família (timed entry)." },
        { es: "Paseo de Gracia: Casa Batlló y La Pedrera.", en: "Passeig de Gràcia: Casa Batlló and La Pedrera." },
        { es: "Tarde en el barrio de Gràcia.", en: "Afternoon in the Gràcia neighbourhood." },
      ],
    },
    {
      titulo: { es: "Día 2: ciudad vieja y mar", en: "Day 2: old town and the sea" },
      actividades: [
        { es: "Barrio Gótico y Catedral.", en: "Gothic Quarter and Cathedral." },
        { es: "Mercado de la Boquería y La Rambla.", en: "La Boqueria market and La Rambla." },
        { es: "El Born y Santa María del Mar.", en: "El Born and Santa Maria del Mar." },
        { es: "Atardecer en la Barceloneta.", en: "Sunset at Barceloneta." },
      ],
    },
    {
      titulo: { es: "Día 3: Park Güell y Montjuïc", en: "Day 3: Park Güell and Montjuïc" },
      actividades: [
        { es: "Park Güell a primera hora (entrada con horario).", en: "Park Güell first thing (timed entry)." },
        { es: "Montjuïc: castillo, miradores y Fundación Miró.", en: "Montjuïc: castle, viewpoints and the Miró Foundation." },
        { es: "Cena en Poble-sec (calle Blai, pinchos).", en: "Dinner in Poble-sec (Carrer de Blai, pintxos)." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Sagrada Família: básica / con torre", en: "Sagrada Família: basic / with tower" }, monto: { es: "€26 / €36", en: "€26 / €36" }, enlace: "https://sagradafamilia.org", verificado: true },
    { concepto: { es: "Park Güell", en: "Park Güell" }, monto: { es: "≈ €18", en: "≈ €18" }, enlace: "https://parkguell.barcelona" },
    { concepto: { es: "Casa Batlló", en: "Casa Batlló" }, monto: { es: "desde ≈ €35", en: "from ≈ €35" } },
    { concepto: { es: "Tarjeta de 10 viajes (T-casual)", en: "10-ride card (T-casual)" }, monto: { es: "≈ €13", en: "≈ €13" } },
    { concepto: { es: "Menú del mediodía / tapas para cenar", en: "Lunch set menu / tapas dinner" }, monto: { es: "€15–20 / €20–35", en: "€15–20 / €20–35" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "€35–55 / €120–200", en: "€35–55 / €120–200" } },
  ],
  porDia: { economico: [80, 110], equilibrado: [170, 240], premium: [380, 550] },
  consejos: [
    { es: "La Sagrada Família y el Park Güell solo venden entradas con horario: comprá online antes de ir.", en: "Sagrada Família and Park Güell only sell timed tickets: buy online before you go." },
    { es: "Cuidá el celular y la billetera en La Rambla y el metro: hay muchos carteristas.", en: "Watch your phone and wallet on La Rambla and the metro: pickpockets are common." },
    { es: "La tasa turística de Barcelona se cobra por noche y es de las más altas de Europa.", en: "Barcelona's tourist tax is charged per night and is among the highest in Europe." },
  ],
};
