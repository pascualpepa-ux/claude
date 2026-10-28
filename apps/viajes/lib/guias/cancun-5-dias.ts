import type { Guia } from "./tipos";

export const cancun: Guia = {
  slug: "cancun-5-dias",
  dias: 5,
  claves: ["cancun", "riviera maya", "tulum", "chichen itza", "isla mujeres", "playa del carmen"],
  destino: { buscar: "Cancun", pais: "MX", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Cancún en 5 días", en: "What to do in Cancún in 5 days" },
  descripcion: {
    es: "Itinerario de 5 días en Cancún: playas, Isla Mujeres, Chichén Itzá, Tulum y cenotes, con precios aproximados y consejos.",
    en: "A 5-day Cancún itinerary: beaches, Isla Mujeres, Chichén Itzá, Tulum and cenotes, with approximate prices and tips.",
  },
  intro: {
    es: "Cancún es mucho más que la zona hotelera: en cinco días combinás playas de agua turquesa, una isla, ruinas mayas y cenotes para nadar. Los buses ADO conectan todo de forma barata y segura.",
    en: "Cancún is much more than the hotel zone: in five days you combine turquoise beaches, an island, Mayan ruins and cenotes to swim in. ADO buses connect it all cheaply and safely.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: playas de la zona hotelera", en: "Day 1: hotel zone beaches" },
      actividades: [
        { es: "Playa Delfines y el mirador del cartel de Cancún.", en: "Playa Delfines and the Cancún sign viewpoint." },
        { es: "Atardecer en la laguna Nichupté.", en: "Sunset over the Nichupté lagoon." },
        { es: "Cena de tacos en el Parque de las Palapas (centro).", en: "Taco dinner at Parque de las Palapas (downtown)." },
      ],
    },
    {
      titulo: { es: "Día 2: Isla Mujeres", en: "Day 2: Isla Mujeres" },
      actividades: [
        { es: "Ferry desde Puerto Juárez (unos 20 minutos).", en: "Ferry from Puerto Juárez (about 20 minutes)." },
        { es: "Playa Norte, de las más lindas del Caribe mexicano.", en: "Playa Norte, one of the prettiest beaches in the Mexican Caribbean." },
        { es: "Recorrer la isla en carrito de golf hasta Punta Sur.", en: "Ride a golf cart around the island to Punta Sur." },
      ],
    },
    {
      titulo: { es: "Día 3: Chichén Itzá y Valladolid", en: "Day 3: Chichén Itzá and Valladolid" },
      actividades: [
        { es: "Chichén Itzá temprano, antes del calor y de los grupos.", en: "Chichén Itzá early, before the heat and the tour groups." },
        { es: "Nadar en el cenote Ik Kil.", en: "Swim in the Ik Kil cenote." },
        { es: "Paseo y cena en el pueblo colonial de Valladolid.", en: "A walk and dinner in colonial Valladolid." },
      ],
    },
    {
      titulo: { es: "Día 4: Tulum", en: "Day 4: Tulum" },
      actividades: [
        { es: "Ruinas de Tulum frente al mar.", en: "The seaside ruins of Tulum." },
        { es: "Playa Paraíso.", en: "Playa Paraíso." },
        { es: "Snorkel en el Gran Cenote.", en: "Snorkeling at Gran Cenote." },
      ],
    },
    {
      titulo: { es: "Día 5: arrecife y despedida", en: "Day 5: reef and farewell" },
      actividades: [
        { es: "Snorkel en el arrecife de Puerto Morelos.", en: "Snorkeling on the Puerto Morelos reef." },
        { es: "Última tarde de playa y vuelta al aeropuerto.", en: "One last beach afternoon and back to the airport." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Entrada a Chichén Itzá (extranjeros)", en: "Chichén Itzá entry (foreigners)" }, monto: { es: "≈ MXN 650", en: "≈ MXN 650" } },
    { concepto: { es: "Ferry a Isla Mujeres, ida y vuelta", en: "Isla Mujeres ferry, return" }, monto: { es: "≈ MXN 450", en: "≈ MXN 450" } },
    { concepto: { es: "Entrada a un cenote", en: "Cenote entry" }, monto: { es: "MXN 150–500", en: "MXN 150–500" } },
    { concepto: { es: "Bus ADO aeropuerto–centro", en: "ADO bus airport–downtown" }, monto: { es: "≈ MXN 120", en: "≈ MXN 120" } },
    { concepto: { es: "Tacos al pastor / cena en restaurante", en: "Tacos al pastor / restaurant dinner" }, monto: { es: "MXN 25 c/u / US$ 20–40", en: "MXN 25 each / US$20–40" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "US$ 15–30 / US$ 110–200", en: "US$15–30 / US$110–200" } },
  ],
  porDia: { economico: [50, 80], equilibrado: [140, 200], premium: [350, 550] },
  consejos: [
    { es: "Quintana Roo cobra un impuesto turístico (Visitax) que se paga online antes de volver: tenelo en cuenta.", en: "Quintana Roo charges a tourist tax (Visitax) paid online before you fly home: budget for it." },
    { es: "Pagá en pesos mexicanos: en dólares casi siempre te cobran más.", en: "Pay in Mexican pesos: paying in dollars almost always costs more." },
    { es: "En los cenotes usá protector solar biodegradable o directamente no uses: lo piden para cuidar el agua.", en: "Use reef-safe sunscreen in cenotes, or none at all: they ask to protect the water." },
  ],
};
