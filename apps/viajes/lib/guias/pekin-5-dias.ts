import type { Guia } from "./tipos";

export const pekin: Guia = {
  slug: "pekin-5-dias",
  dias: 5,
  claves: ["pekin","beijing","gran muralla","great wall","ciudad prohibida","forbidden city"],
  destino: { buscar: "Beijing", pais: "CN", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Pekín (Beijing) en 5 días", en: "What to do in Beijing in 5 days" },
  descripcion: {
    es: "Itinerario de 5 días en Pekín: Ciudad Prohibida, Gran Muralla en Mutianyu, Templo del Cielo y hutongs, con precios aproximados y consejos.",
    en: "A 5-day Beijing itinerary: the Forbidden City, the Great Wall at Mutianyu, the Temple of Heaven and the hutongs, with approximate prices and tips.",
  },
  intro: {
    es: "Pekín es enorme y muy barata para comer y moverse. En cinco días ves los palacios imperiales, una parte bien conservada de la Gran Muralla y los callejones tradicionales.",
    en: "Beijing is huge and very cheap for food and transport. In five days you see the imperial palaces, a well-kept stretch of the Great Wall and the traditional alleys.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: el corazón imperial", en: "Day 1: the imperial heart" },
      actividades: [
        { es: "Plaza de Tiananmén (llevá el pasaporte).", en: "Tiananmen Square (bring your passport)." },
        { es: "Ciudad Prohibida (reserva con pasaporte, días antes).", en: "Forbidden City (book with your passport, days ahead)." },
        { es: "Parque Jingshan para ver el palacio desde arriba.", en: "Jingshan Park to see the palace from above." },
      ],
    },
    {
      titulo: { es: "Día 2: la Gran Muralla", en: "Day 2: the Great Wall" },
      actividades: [
        { es: "Mutianyu: menos gente que Badaling y muy bien restaurada.", en: "Mutianyu: fewer crowds than Badaling and well restored." },
        { es: "Subir en telesilla o teleférico y bajar en tobogán.", en: "Go up by chairlift or cable car and come down on the toboggan." },
        { es: "Cena de pato laqueado.", en: "Peking duck for dinner." },
      ],
    },
    {
      titulo: { es: "Día 3: templos y hutongs", en: "Day 3: temples and hutongs" },
      actividades: [
        { es: "Templo del Cielo temprano (la gente hace tai chi).", en: "Temple of Heaven early (locals practise tai chi)." },
        { es: "Templo de los Lamas.", en: "Lama Temple." },
        { es: "Hutongs de Nanluoguxiang y lagos de Houhai.", en: "Nanluoguxiang hutongs and Houhai lakes." },
      ],
    },
    {
      titulo: { es: "Día 4: Palacio de Verano", en: "Day 4: the Summer Palace" },
      actividades: [
        { es: "Palacio de Verano y lago Kunming.", en: "Summer Palace and Kunming Lake." },
        { es: "Tarde en el distrito artístico 798.", en: "Afternoon in the 798 Art District." },
      ],
    },
    {
      titulo: { es: "Día 5: lo moderno", en: "Day 5: modern Beijing" },
      actividades: [
        { es: "Parque Olímpico (Nido de Pájaro y Cubo de Agua).", en: "Olympic Park (Bird's Nest and Water Cube)." },
        { es: "Compras en Wangfujing o Sanlitun.", en: "Shopping in Wangfujing or Sanlitun." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Ciudad Prohibida (temporada alta / baja)", en: "Forbidden City (high / low season)" }, monto: { es: "≈ ¥60 / ¥40", en: "≈ ¥60 / ¥40" } },
    { concepto: { es: "Gran Muralla en Mutianyu (entrada + teleférico)", en: "Great Wall at Mutianyu (entry + cable car)" }, monto: { es: "≈ ¥40 + ¥120–140", en: "≈ ¥40 + ¥120–140" } },
    { concepto: { es: "Templo del Cielo (entrada completa)", en: "Temple of Heaven (full ticket)" }, monto: { es: "≈ ¥34", en: "≈ ¥34" } },
    { concepto: { es: "Palacio de Verano (entrada completa)", en: "Summer Palace (full ticket)" }, monto: { es: "≈ ¥60", en: "≈ ¥60" } },
    { concepto: { es: "Viaje en metro", en: "Metro ride" }, monto: { es: "¥3–10", en: "¥3–10" } },
    { concepto: { es: "Plato de fideos / pato laqueado para dos", en: "Bowl of noodles / Peking duck for two" }, monto: { es: "¥20–40 / ¥250–400", en: "¥20–40 / ¥250–400" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "¥100–180 / ¥400–700", en: "¥100–180 / ¥400–700" } },
  ],
  porDia: { economico: [55, 80], equilibrado: [120, 180], premium: [280, 450] },
  consejos: [
    { es: "Revisá los requisitos de visa para tu pasaporte antes de comprar el vuelo.", en: "Check the visa requirements for your passport before buying the flight." },
    { es: "Casi todo se paga con Alipay o WeChat Pay, que aceptan tarjetas extranjeras: configuralos antes de viajar.", en: "Almost everything is paid with Alipay or WeChat Pay, which accept foreign cards: set them up before you travel." },
    { es: "Google y muchas apps occidentales no funcionan: bajá mapas sin conexión y un traductor.", en: "Google and many Western apps don't work: download offline maps and a translator." },
  ],
};
