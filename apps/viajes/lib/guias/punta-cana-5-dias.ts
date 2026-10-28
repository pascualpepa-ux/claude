import type { Guia } from "./tipos";

export const puntaCana: Guia = {
  slug: "punta-cana-5-dias",
  dias: 5,
  claves: ["punta cana", "bavaro", "republica dominicana", "dominicana", "isla saona"],
  destino: { buscar: "Punta Cana", pais: "DO", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Punta Cana en 5 días", en: "What to do in Punta Cana in 5 days" },
  descripcion: {
    es: "Itinerario de 5 días en Punta Cana: playas de Bávaro y Macao, Isla Saona, Hoyo Azul y Altos de Chavón, con precios aproximados y consejos.",
    en: "A 5-day Punta Cana itinerary: Bávaro and Macao beaches, Saona Island, Hoyo Azul and Altos de Chavón, with approximate prices and tips.",
  },
  intro: {
    es: "Punta Cana es sinónimo de playa caribeña y hoteles todo incluido, pero vale la pena salir: Isla Saona, un cenote azul y un pueblo de piedra sobre el río completan cinco días perfectos.",
    en: "Punta Cana means Caribbean beaches and all-inclusive resorts, but it's worth heading out: Saona Island, a blue sinkhole and a stone village above a river round out five perfect days.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: playa de Bávaro", en: "Day 1: Bávaro beach" },
      actividades: [
        { es: "Llegada y tarde en la playa de Bávaro.", en: "Arrival and an afternoon on Bávaro beach." },
        { es: "Cena en Los Corales, frente al mar.", en: "Dinner in Los Corales, by the sea." },
      ],
    },
    {
      titulo: { es: "Día 2: Isla Saona", en: "Day 2: Saona Island" },
      actividades: [
        { es: "Excursión en catamarán y lancha a Isla Saona.", en: "Catamaran and speedboat trip to Saona Island." },
        { es: "Parada en la piscina natural con estrellas de mar.", en: "Stop at the natural pool with starfish." },
      ],
    },
    {
      titulo: { es: "Día 3: Hoyo Azul", en: "Day 3: Hoyo Azul" },
      actividades: [
        { es: "Nadar en el Hoyo Azul, un cenote de agua turquesa.", en: "Swim in Hoyo Azul, a turquoise sinkhole." },
        { es: "Tirolesas y cuevas en el parque.", en: "Ziplines and caves in the park." },
      ],
    },
    {
      titulo: { es: "Día 4: Altos de Chavón", en: "Day 4: Altos de Chavón" },
      actividades: [
        { es: "Altos de Chavón, réplica de un pueblo mediterráneo sobre el río Chavón.", en: "Altos de Chavón, a replica Mediterranean village above the Chavón river." },
        { es: "Paseo por La Romana.", en: "A stroll through La Romana." },
      ],
    },
    {
      titulo: { es: "Día 5: Macao y Juanillo", en: "Day 5: Macao and Juanillo" },
      actividades: [
        { es: "Playa Macao, con olas y sin hoteles enormes.", en: "Macao beach, with waves and no huge resorts." },
        { es: "Playa Juanillo en Cap Cana y vuelta.", en: "Juanillo beach in Cap Cana, then home." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Excursión a Isla Saona con almuerzo", en: "Saona Island trip with lunch" }, monto: { es: "≈ US$ 80–130", en: "≈ US$80–130" } },
    { concepto: { es: "Parque del Hoyo Azul", en: "Hoyo Azul park" }, monto: { es: "≈ US$ 90–150", en: "≈ US$90–150" } },
    { concepto: { es: "Taxi aeropuerto–Bávaro", en: "Taxi airport–Bávaro" }, monto: { es: "≈ US$ 30–40", en: "≈ US$30–40" } },
    { concepto: { es: "Plato del día dominicano / cena en restaurante", en: "Dominican dish of the day / restaurant dinner" }, monto: { es: "US$ 8–12 / US$ 25–50", en: "US$8–12 / US$25–50" } },
    { concepto: { es: "Hostal / hotel todo incluido (noche, por persona)", en: "Guesthouse / all-inclusive resort (night, per person)" }, monto: { es: "US$ 35–60 / US$ 120–250", en: "US$35–60 / US$120–250" } },
  ],
  porDia: { economico: [70, 110], equilibrado: [180, 260], premium: [400, 650] },
  consejos: [
    { es: "Un hotel todo incluido suele salir más barato que pagar comidas y bebidas por separado.", en: "An all-inclusive resort is usually cheaper than paying for meals and drinks separately." },
    { es: "Acordá el precio del taxi antes de subir: no usan taxímetro.", en: "Agree on the taxi fare before getting in: they don't use meters." },
    { es: "Se paga en pesos dominicanos o dólares; con dólares en efectivo chicos todo es más fácil.", en: "You can pay in Dominican pesos or dollars; small US dollar bills make everything easier." },
  ],
};
