import type { Guia } from "./tipos";

export const bariloche: Guia = {
  slug: "bariloche-4-dias",
  dias: 4,
  claves: ["bariloche", "san carlos de bariloche", "patagonia", "cerro catedral", "llao llao", "nahuel huapi"],
  destino: { buscar: "Bariloche", pais: "AR", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Bariloche en 4 días", en: "What to do in Bariloche in 4 days" },
  descripcion: {
    es: "Itinerario de 4 días en Bariloche: Circuito Chico, Cerro Campanario, Cerro Catedral e Isla Victoria, con precios aproximados y consejos.",
    en: "A 4-day Bariloche itinerary: Circuito Chico, Cerro Campanario, Cerro Catedral and Victoria Island, with approximate prices and tips.",
  },
  intro: {
    es: "Bariloche tiene lagos, montañas y chocolate. En cuatro días hacés el Circuito Chico, subís a los miradores más lindos de la Patagonia y navegás el Nahuel Huapi, en invierno o en verano.",
    en: "Bariloche has lakes, mountains and chocolate. In four days you drive the Circuito Chico, ride up to Patagonia's best viewpoints and sail Lake Nahuel Huapi, in winter or summer.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: el centro", en: "Day 1: downtown" },
      actividades: [
        { es: "Centro Cívico y la costanera del lago Nahuel Huapi.", en: "The Civic Center and the Nahuel Huapi lakefront." },
        { es: "Chocolaterías de la calle Mitre.", en: "Chocolate shops on Mitre street." },
        { es: "Cena de cordero patagónico o trucha.", en: "Patagonian lamb or trout for dinner." },
      ],
    },
    {
      titulo: { es: "Día 2: Circuito Chico", en: "Day 2: Circuito Chico" },
      actividades: [
        { es: "Aerosilla al Cerro Campanario, una de las mejores vistas del mundo.", en: "Chairlift up Cerro Campanario, one of the world's great views." },
        { es: "Hotel Llao Llao y Puerto Pañuelo.", en: "Llao Llao Hotel and Puerto Pañuelo." },
        { es: "Punto Panorámico y Bahía López.", en: "Punto Panorámico and Bahía López." },
      ],
    },
    {
      titulo: { es: "Día 3: Cerro Catedral", en: "Day 3: Cerro Catedral" },
      actividades: [
        { es: "En invierno, esquí o snowboard; en verano, trekking y vistas.", en: "Skiing or snowboarding in winter; trekking and views in summer." },
        { es: "Merienda en una casa de té de Villa Catedral.", en: "Afternoon tea in Villa Catedral." },
      ],
    },
    {
      titulo: { es: "Día 4: Isla Victoria y Arrayanes", en: "Day 4: Victoria Island and Arrayanes" },
      actividades: [
        { es: "Navegación por el Nahuel Huapi a Isla Victoria.", en: "Boat trip on Lake Nahuel Huapi to Victoria Island." },
        { es: "Bosque de Arrayanes, árboles de tronco color canela.", en: "Arrayanes Forest, trees with cinnamon-colored trunks." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Aerosilla del Cerro Campanario", en: "Cerro Campanario chairlift" }, monto: { es: "≈ US$ 15–20", en: "≈ US$15–20" } },
    { concepto: { es: "Navegación a Isla Victoria y Arrayanes", en: "Boat trip to Victoria Island and Arrayanes" }, monto: { es: "≈ US$ 45–70", en: "≈ US$45–70" } },
    { concepto: { es: "Pase de esquí de un día en Cerro Catedral (invierno)", en: "One-day ski pass at Cerro Catedral (winter)" }, monto: { es: "≈ US$ 70–90", en: "≈ US$70–90" } },
    { concepto: { es: "Colectivo con tarjeta SUBE", en: "Bus with a SUBE card" }, monto: { es: "≈ US$ 1", en: "≈ US$1" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "US$ 20–35 / US$ 70–130", en: "US$20–35 / US$70–130" } },
  ],
  porDia: { economico: [45, 70], equilibrado: [110, 170], premium: [280, 450] },
  consejos: [
    { es: "Sacá la tarjeta SUBE apenas llegues: los colectivos al Circuito Chico y al Catedral no aceptan efectivo.", en: "Get a SUBE card as soon as you arrive: buses to Circuito Chico and Catedral don't take cash." },
    { es: "El clima cambia rápido aunque sea verano: llevá abrigo en capas.", en: "The weather changes fast even in summer: dress in layers." },
    { es: "En julio (vacaciones de invierno) todo se llena: reservá alojamiento y excursiones con tiempo.", en: "July (winter school holidays) gets packed: book lodging and tours well ahead." },
  ],
};
