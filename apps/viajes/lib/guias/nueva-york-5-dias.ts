import type { Guia } from "./tipos";

export const nuevaYork: Guia = {
  slug: "nueva-york-5-dias",
  dias: 5,
  claves: ["nueva york","new york","nyc","manhattan","brooklyn"],
  destino: { buscar: "New York", pais: "US", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Nueva York en 5 días", en: "What to do in New York in 5 days" },
  descripcion: {
    es: "Itinerario de 5 días en Nueva York: Estatua de la Libertad, Central Park, MET, Brooklyn y miradores, con precios aproximados y consejos.",
    en: "A 5-day New York itinerary: the Statue of Liberty, Central Park, the Met, Brooklyn and observation decks, with approximate prices and tips.",
  },
  intro: {
    es: "Nueva York se recorre por barrios. En cinco días ves el bajo Manhattan, Midtown, Central Park con sus museos, Brooklyn y algún mirador, usando el subte y caminando mucho.",
    en: "New York is best explored neighbourhood by neighbourhood. In five days you see Lower Manhattan, Midtown, Central Park and its museums, Brooklyn and an observation deck, by subway and on foot.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: el bajo Manhattan", en: "Day 1: Lower Manhattan" },
      actividades: [
        { es: "Ferry a la Estatua de la Libertad y Ellis Island.", en: "Ferry to the Statue of Liberty and Ellis Island." },
        { es: "Wall Street y Memorial del 11-S.", en: "Wall Street and the 9/11 Memorial." },
        { es: "Cruzar el puente de Brooklyn a pie al atardecer.", en: "Walk across the Brooklyn Bridge at sunset." },
      ],
    },
    {
      titulo: { es: "Día 2: Midtown", en: "Day 2: Midtown" },
      actividades: [
        { es: "Grand Central, Biblioteca Pública y Bryant Park.", en: "Grand Central, the Public Library and Bryant Park." },
        { es: "Rockefeller Center y la Quinta Avenida.", en: "Rockefeller Center and Fifth Avenue." },
        { es: "Times Square de noche (y un musical de Broadway si entra en el presupuesto).", en: "Times Square at night (and a Broadway show if the budget allows)." },
      ],
    },
    {
      titulo: { es: "Día 3: Central Park y museos", en: "Day 3: Central Park and museums" },
      actividades: [
        { es: "Central Park caminando o en bici.", en: "Central Park on foot or by bike." },
        { es: "Museo Metropolitano (MET) o Museo de Historia Natural.", en: "The Met or the Natural History Museum." },
        { es: "Upper West Side y cena.", en: "Upper West Side and dinner." },
      ],
    },
    {
      titulo: { es: "Día 4: West Side y Village", en: "Day 4: West Side and the Village" },
      actividades: [
        { es: "High Line, Chelsea Market y Hudson Yards.", en: "The High Line, Chelsea Market and Hudson Yards." },
        { es: "Greenwich Village y SoHo.", en: "Greenwich Village and SoHo." },
        { es: "Chinatown y Little Italy para cenar.", en: "Chinatown and Little Italy for dinner." },
      ],
    },
    {
      titulo: { es: "Día 5: Brooklyn y un mirador", en: "Day 5: Brooklyn and a view" },
      actividades: [
        { es: "DUMBO y Brooklyn Bridge Park.", en: "DUMBO and Brooklyn Bridge Park." },
        { es: "Williamsburg (mercados y cafés).", en: "Williamsburg (markets and cafés)." },
        { es: "Mirador al atardecer: Top of the Rock, Empire State o Edge.", en: "Observation deck at sunset: Top of the Rock, Empire State or Edge." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Ferry a la Estatua de la Libertad y Ellis Island", en: "Statue of Liberty and Ellis Island ferry" }, monto: { es: "≈ US$ 25", en: "≈ US$25" }, enlace: "https://www.nps.gov/stli/" },
    { concepto: { es: "MET (visitantes de fuera del estado)", en: "The Met (out-of-state visitors)" }, monto: { es: "≈ US$ 30", en: "≈ US$30" }, enlace: "https://www.metmuseum.org" },
    { concepto: { es: "Mirador (Top of the Rock, Empire State, Edge)", en: "Observation deck (Top of the Rock, Empire State, Edge)" }, monto: { es: "US$ 40–50", en: "US$40–50" } },
    { concepto: { es: "Viaje en subte o bus", en: "Subway or bus ride" }, monto: { es: "≈ US$ 3", en: "≈ US$3" } },
    { concepto: { es: "Porción de pizza / almuerzo en deli", en: "Pizza slice / deli lunch" }, monto: { es: "US$ 4–6 / US$ 15–20", en: "US$4–6 / US$15–20" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "US$ 60–90 / US$ 200–320", en: "US$60–90 / US$200–320" } },
  ],
  porDia: { economico: [150, 200], equilibrado: [300, 420], premium: [600, 900] },
  consejos: [
    { es: "En el subte pagás tocando con tarjeta o celular: después de 12 viajes en 7 días, el resto de la semana es gratis.", en: "Pay on the subway by tapping a card or phone: after 12 rides in 7 days, the rest of the week is free." },
    { es: "En restaurantes se deja propina (18–20 %) y los precios no incluyen impuestos.", en: "Restaurants expect an 18–20% tip and prices exclude sales tax." },
    { es: "El ferry gratis a Staten Island pasa cerca de la Estatua de la Libertad (no para en la isla).", en: "The free Staten Island Ferry passes near the Statue of Liberty (it doesn't stop on the island)." },
  ],
};
