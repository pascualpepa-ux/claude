import type { Guia } from "./tipos";

export const lisboa: Guia = {
  slug: "lisboa-3-dias",
  dias: 3,
  claves: ["lisboa","lisbon","sintra"],
  destino: { buscar: "Lisboa", pais: "PT", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Lisboa en 3 días", en: "What to do in Lisbon in 3 days" },
  descripcion: {
    es: "Itinerario de 3 días en Lisboa: Alfama, tranvía 28, Belém, miradores y excursión a Sintra, con precios aproximados y consejos.",
    en: "A 3-day Lisbon itinerary: Alfama, tram 28, Belém, viewpoints and a Sintra day trip, with approximate prices and tips.",
  },
  intro: {
    es: "Lisboa es de las capitales más baratas de Europa occidental y se disfruta subiendo y bajando colinas entre miradores. Tres días dan para la ciudad, Belém y Sintra.",
    en: "Lisbon is one of Western Europe's cheapest capitals and is best enjoyed climbing up and down hills between viewpoints. Three days cover the city, Belém and Sintra.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: Baixa y Alfama", en: "Day 1: Baixa and Alfama" },
      actividades: [
        { es: "Plaza del Comercio y Rua Augusta.", en: "Praça do Comércio and Rua Augusta." },
        { es: "Tranvía 28 hacia Alfama y Castillo de San Jorge.", en: "Tram 28 to Alfama and São Jorge Castle." },
        { es: "Miradores de Santa Luzia y Graça; cena con fado.", en: "Santa Luzia and Graça viewpoints; dinner with fado." },
      ],
    },
    {
      titulo: { es: "Día 2: Belém", en: "Day 2: Belém" },
      actividades: [
        { es: "Monasterio de los Jerónimos y Torre de Belém.", en: "Jerónimos Monastery and Belém Tower." },
        { es: "Pasteles de Belém en la confitería original.", en: "Pastéis de Belém at the original bakery." },
        { es: "LX Factory y atardecer en el Bairro Alto.", en: "LX Factory and sunset in Bairro Alto." },
      ],
    },
    {
      titulo: { es: "Día 3: Sintra", en: "Day 3: Sintra" },
      actividades: [
        { es: "Tren desde Rossio (unos 40 minutos).", en: "Train from Rossio (about 40 minutes)." },
        { es: "Palacio da Pena y Quinta da Regaleira.", en: "Pena Palace and Quinta da Regaleira." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Monasterio de los Jerónimos", en: "Jerónimos Monastery" }, monto: { es: "≈ €18", en: "≈ €18" } },
    { concepto: { es: "Torre de Belém", en: "Belém Tower" }, monto: { es: "≈ €12", en: "≈ €12" } },
    { concepto: { es: "Palacio da Pena (Sintra)", en: "Pena Palace (Sintra)" }, monto: { es: "≈ €20", en: "≈ €20" }, enlace: "https://www.parquesdesintra.pt" },
    { concepto: { es: "Pase de transporte de 24 h", en: "24-hour transport pass" }, monto: { es: "≈ €7", en: "≈ €7" } },
    { concepto: { es: "Pastel de nata / almuerzo en tasca", en: "Pastel de nata / tasca lunch" }, monto: { es: "€1,30–1,60 / €12–18", en: "€1.30–1.60 / €12–18" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "€25–40 / €90–150", en: "€25–40 / €90–150" } },
  ],
  porDia: { economico: [65, 95], equilibrado: [140, 200], premium: [320, 480] },
  consejos: [
    { es: "Llevá calzado cómodo con buena suela: las veredas de piedra resbalan.", en: "Wear comfy shoes with good grip: the stone pavements are slippery." },
    { es: "El tranvía 28 se llena: subite temprano o en la parada de cabecera (Martim Moniz).", en: "Tram 28 gets packed: board early or at the first stop (Martim Moniz)." },
    { es: "En Sintra, entrá a la Pena a primera hora y reservá la entrada online.", en: "In Sintra, visit Pena first thing and book online." },
  ],
};
