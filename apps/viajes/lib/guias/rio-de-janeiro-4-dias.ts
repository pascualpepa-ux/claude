import type { Guia } from "./tipos";

export const rio: Guia = {
  slug: "rio-de-janeiro-4-dias",
  dias: 4,
  claves: ["rio de janeiro","rio","cristo redentor","pan de azucar","sugarloaf","copacabana"],
  destino: { buscar: "Rio de Janeiro", pais: "BR", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Río de Janeiro en 4 días", en: "What to do in Rio de Janeiro in 4 days" },
  descripcion: {
    es: "Itinerario de 4 días en Río: Cristo Redentor, Pan de Azúcar, Copacabana, Ipanema y Santa Teresa, con precios aproximados y consejos.",
    en: "A 4-day Rio itinerary: Christ the Redeemer, Sugarloaf, Copacabana, Ipanema and Santa Teresa, with approximate prices and tips.",
  },
  intro: {
    es: "Río combina playas urbanas, morros con vistas enormes y mucha música. En cuatro días ves los dos íconos, las playas del sur y el centro histórico, dejando margen por si llueve.",
    en: "Rio combines city beaches, hills with huge views and lots of music. In four days you see both icons, the southern beaches and the historic centre, with room to spare if it rains.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: Copacabana e Ipanema", en: "Day 1: Copacabana and Ipanema" },
      actividades: [
        { es: "Playa de Copacabana y fuerte de Copacabana.", en: "Copacabana beach and Copacabana fort." },
        { es: "Caminata a Ipanema; atardecer en la Piedra del Arpoador.", en: "Walk to Ipanema; sunset at Arpoador rock." },
      ],
    },
    {
      titulo: { es: "Día 2: Cristo Redentor", en: "Day 2: Christ the Redeemer" },
      actividades: [
        { es: "Tren del Corcovado temprano y en día despejado.", en: "Corcovado train early on a clear day." },
        { es: "Jardín Botánico y laguna Rodrigo de Freitas.", en: "Botanical Garden and Rodrigo de Freitas lagoon." },
      ],
    },
    {
      titulo: { es: "Día 3: Pan de Azúcar y centro", en: "Day 3: Sugarloaf and downtown" },
      actividades: [
        { es: "Escalera Selarón y Arcos de Lapa.", en: "Selarón Steps and the Lapa Arches." },
        { es: "Santa Teresa en el tranvía (bondinho).", en: "Santa Teresa on the tram (bondinho)." },
        { es: "Teleférico al Pan de Azúcar al atardecer.", en: "Cable car up Sugarloaf at sunset." },
      ],
    },
    {
      titulo: { es: "Día 4: playa y fútbol", en: "Day 4: beach and football" },
      actividades: [
        { es: "Leblon y mirador Dois Irmãos (con guía) o día de playa.", en: "Leblon and the Dois Irmãos viewpoint (with a guide) or a beach day." },
        { es: "Partido en el Maracanã si hay fecha, o recorrido del estadio.", en: "A match at the Maracanã if there's one, or a stadium tour." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Tren del Corcovado + Cristo Redentor", en: "Corcovado train + Christ the Redeemer" }, monto: { es: "≈ R$ 100–130", en: "≈ R$100–130" }, enlace: "https://www.tremdocorcovado.rio" },
    { concepto: { es: "Teleférico del Pan de Azúcar", en: "Sugarloaf cable car" }, monto: { es: "≈ R$ 195", en: "≈ R$195" }, enlace: "https://www.bondinho.com.br" },
    { concepto: { es: "Viaje en metro", en: "Metro ride" }, monto: { es: "≈ R$ 7,50", en: "≈ R$7.50" } },
    { concepto: { es: "Coco en la playa / plato del día", en: "Coconut on the beach / dish of the day" }, monto: { es: "R$ 8–12 / R$ 35–60", en: "R$8–12 / R$35–60" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "R$ 80–150 / R$ 400–700", en: "R$80–150 / R$400–700" } },
  ],
  porDia: { economico: [55, 85], equilibrado: [130, 190], premium: [300, 480] },
  consejos: [
    { es: "Subí al Cristo y al Pan de Azúcar solo con cielo despejado: si hay nubes no se ve nada.", en: "Only go up Christ and Sugarloaf on a clear day: with clouds you won't see a thing." },
    { es: "En la playa llevá lo justo y no dejes cosas solas; de noche, movete en taxi o app.", en: "Take only the essentials to the beach and don't leave things alone; at night, use a taxi or ride app." },
    { es: "Revisá si tu pasaporte necesita visa para Brasil antes de viajar.", en: "Check whether your passport needs a visa for Brazil before travelling." },
  ],
};
