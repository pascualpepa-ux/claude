import type { Guia } from "./tipos";

export const miami: Guia = {
  slug: "miami-4-dias",
  dias: 4,
  claves: ["miami", "miami beach", "south beach", "wynwood", "everglades", "florida"],
  destino: { buscar: "Miami", pais: "US", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Miami en 4 días", en: "What to do in Miami in 4 days" },
  descripcion: {
    es: "Itinerario de 4 días en Miami: South Beach, Wynwood, Little Havana, los Everglades y Vizcaya, con precios aproximados y consejos.",
    en: "A 4-day Miami itinerary: South Beach, Wynwood, Little Havana, the Everglades and Vizcaya, with approximate prices and tips.",
  },
  intro: {
    es: "Miami mezcla playa, arte urbano y cultura latina. En cuatro días ves South Beach, los murales de Wynwood, la Calle Ocho y te escapás a los Everglades a ver caimanes.",
    en: "Miami mixes beach, street art and Latin culture. In four days you see South Beach, the Wynwood murals, Calle Ocho and escape to the Everglades to see alligators.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: South Beach", en: "Day 1: South Beach" },
      actividades: [
        { es: "Playa de South Beach y los puestos de salvavidas de colores.", en: "South Beach and its colorful lifeguard towers." },
        { es: "Ocean Drive y los edificios Art Deco.", en: "Ocean Drive and the Art Deco buildings." },
        { es: "Paseo y cena en Lincoln Road.", en: "Stroll and dinner on Lincoln Road." },
      ],
    },
    {
      titulo: { es: "Día 2: Wynwood y Little Havana", en: "Day 2: Wynwood and Little Havana" },
      actividades: [
        { es: "Murales de Wynwood Walls y las calles del barrio.", en: "Wynwood Walls murals and the neighborhood's streets." },
        { es: "Design District.", en: "Design District." },
        { es: "Calle Ocho: café cubano, Máximo Gómez Park y cena cubana.", en: "Calle Ocho: Cuban coffee, Máximo Gómez Park and a Cuban dinner." },
      ],
    },
    {
      titulo: { es: "Día 3: Everglades", en: "Day 3: the Everglades" },
      actividades: [
        { es: "Paseo en aerobote por los Everglades (caimanes y aves).", en: "Airboat ride through the Everglades (alligators and birds)." },
        { es: "Tarde en Key Biscayne y el faro de Bill Baggs.", en: "Afternoon in Key Biscayne and the Bill Baggs lighthouse." },
      ],
    },
    {
      titulo: { es: "Día 4: Brickell y Vizcaya", en: "Day 4: Brickell and Vizcaya" },
      actividades: [
        { es: "Museo y jardines de Vizcaya.", en: "Vizcaya Museum and Gardens." },
        { es: "Brickell y Bayside Marketplace.", en: "Brickell and Bayside Marketplace." },
        { es: "Recorrer el centro gratis en el Metromover.", en: "Ride the free Metromover around downtown." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Paseo en aerobote por los Everglades", en: "Everglades airboat ride" }, monto: { es: "≈ US$ 35–60", en: "≈ US$35–60" } },
    { concepto: { es: "Museo y jardines de Vizcaya", en: "Vizcaya Museum and Gardens" }, monto: { es: "≈ US$ 25", en: "≈ US$25" } },
    { concepto: { es: "Metromover / Metrorail", en: "Metromover / Metrorail" }, monto: { es: "Gratis / ≈ US$ 2,25", en: "Free / ≈ US$2.25" } },
    { concepto: { es: "Sándwich cubano / cena en restaurante", en: "Cuban sandwich / restaurant dinner" }, monto: { es: "US$ 10–15 / US$ 30–60", en: "US$10–15 / US$30–60" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "US$ 40–70 / US$ 180–300", en: "US$40–70 / US$180–300" } },
  ],
  porDia: { economico: [110, 160], equilibrado: [250, 350], premium: [550, 800] },
  consejos: [
    { es: "En restaurantes se deja propina (18–20 %) y los precios no incluyen impuestos.", en: "Restaurants expect an 18–20% tip and prices exclude tax." },
    { es: "Muchos hoteles cobran un \"resort fee\" por noche aparte del precio: revisalo al reservar.", en: "Many hotels charge a nightly resort fee on top of the rate: check before booking." },
    { es: "De junio a noviembre es temporada de huracanes: mirá el pronóstico antes de viajar.", en: "June to November is hurricane season: check the forecast before you travel." },
  ],
};
