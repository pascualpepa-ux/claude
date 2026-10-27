import type { Guia } from "./tipos";

export const madrid: Guia = {
  slug: "madrid-3-dias",
  dias: 3,
  claves: ["madrid","prado","toledo"],
  destino: { buscar: "Madrid", pais: "ES", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Madrid en 3 días", en: "What to do in Madrid in 3 days" },
  descripcion: {
    es: "Itinerario de 3 días en Madrid: Prado, Retiro, Palacio Real, tapas en La Latina y excursión a Toledo, con precios aproximados y consejos.",
    en: "A 3-day Madrid itinerary: the Prado, Retiro, Royal Palace, tapas in La Latina and a Toledo day trip, with approximate prices and tips.",
  },
  intro: {
    es: "Madrid se disfruta caminando y comiendo: museos de primer nivel a pocas cuadras, parques enormes y bares de tapas hasta tarde. Tres días dan para la ciudad y una escapada a Toledo.",
    en: "Madrid is best enjoyed walking and eating: world-class museums a few blocks apart, huge parks and tapas bars open late. Three days cover the city and a trip to Toledo.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: el Madrid de los Austrias", en: "Day 1: Habsburg Madrid" },
      actividades: [
        { es: "Puerta del Sol y Plaza Mayor.", en: "Puerta del Sol and Plaza Mayor." },
        { es: "Palacio Real y Catedral de la Almudena.", en: "Royal Palace and Almudena Cathedral." },
        { es: "Mercado de San Miguel y tapas en La Latina.", en: "San Miguel Market and tapas in La Latina." },
      ],
    },
    {
      titulo: { es: "Día 2: arte y Retiro", en: "Day 2: art and Retiro" },
      actividades: [
        { es: "Museo del Prado por la mañana.", en: "Prado Museum in the morning." },
        { es: "Parque del Retiro y el Palacio de Cristal.", en: "Retiro Park and the Crystal Palace." },
        { es: "Reina Sofía (el Guernica) por la tarde.", en: "Reina Sofía (Guernica) in the afternoon." },
        { es: "Noche en Malasaña o Chueca.", en: "Evening in Malasaña or Chueca." },
      ],
    },
    {
      titulo: { es: "Día 3: excursión a Toledo", en: "Day 3: day trip to Toledo" },
      actividades: [
        { es: "Tren de alta velocidad desde Atocha (unos 35 minutos).", en: "High-speed train from Atocha (about 35 minutes)." },
        { es: "Catedral, judería y miradores sobre el Tajo.", en: "Cathedral, Jewish quarter and viewpoints over the Tagus." },
        { es: "Vuelta a Madrid y atardecer en el Templo de Debod.", en: "Back to Madrid and sunset at the Temple of Debod." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Museo del Prado (gratis las últimas 2 horas del día)", en: "Prado Museum (free for the last 2 hours of the day)" }, monto: { es: "≈ €15", en: "≈ €15" }, enlace: "https://www.museodelprado.es" },
    { concepto: { es: "Museo Reina Sofía", en: "Reina Sofía Museum" }, monto: { es: "≈ €12", en: "≈ €12" } },
    { concepto: { es: "Palacio Real", en: "Royal Palace" }, monto: { es: "≈ €14", en: "≈ €14" } },
    { concepto: { es: "Tren Madrid–Toledo ida y vuelta", en: "Madrid–Toledo return train" }, monto: { es: "≈ €25", en: "≈ €25" } },
    { concepto: { es: "Viaje en metro (suplemento al aeropuerto aparte)", en: "Metro ride (airport supplement extra)" }, monto: { es: "€1,50–2", en: "€1.50–2" } },
    { concepto: { es: "Caña y tapa / menú del día", en: "Small beer and tapa / menú del día" }, monto: { es: "€3–5 / €13–18", en: "€3–5 / €13–18" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "€30–45 / €100–160", en: "€30–45 / €100–160" } },
  ],
  porDia: { economico: [70, 100], equilibrado: [150, 210], premium: [350, 500] },
  consejos: [
    { es: "El menú del día (entrada, plato, postre y bebida) es la comida más conveniente de lunes a viernes.", en: "The menú del día (starter, main, dessert and drink) is the best-value meal on weekdays." },
    { es: "En Madrid se cena tarde: muchos restaurantes abren a las 20:30 o 21.", en: "Madrid dines late: many restaurants open at 8:30 or 9 pm." },
    { es: "Comprá el tren a Toledo con anticipación los fines de semana.", en: "Buy the Toledo train in advance at weekends." },
  ],
};
