import type { Guia } from "./tipos";

export const japon: Guia = {
  slug: "japon-7-dias-cuanto-cuesta",
  dias: 7,
  claves: ["japon","japan","tokio","tokyo","kioto","kyoto","osaka","jr pass"],
  destino: { buscar: "Japon", pais: "JP", tipo: "pais" },
  revisado: "2026-10",
  titulo: { es: "Cuánto cuesta viajar a Japón 7 días", en: "How much a 7-day trip to Japan costs" },
  descripcion: {
    es: "Cuánto cuesta una semana en Japón: Tokio, Kioto, Nara y Osaka, con precios de alojamiento, comida, trenes y el JR Pass verificado.",
    en: "What a week in Japan costs: Tokyo, Kyoto, Nara and Osaka, with prices for lodging, food, trains and the verified JR Pass.",
  },
  intro: {
    es: "Japón es más accesible de lo que parece: comer bien es barato y el transporte es impecable. El gasto grande es el alojamiento y el tren bala. Esta ruta clásica de 7 días va de Tokio a Osaka.",
    en: "Japan is more affordable than it looks: eating well is cheap and transport is flawless. The big costs are lodging and the bullet train. This classic 7-day route goes from Tokyo to Osaka.",
  },
  itinerario: [
    {
      titulo: { es: "Días 1–3: Tokio", en: "Days 1–3: Tokyo" },
      actividades: [
        { es: "Asakusa y el templo Senso-ji; Akihabara.", en: "Asakusa and Senso-ji temple; Akihabara." },
        { es: "Shibuya (el cruce), Harajuku y el santuario Meiji.", en: "Shibuya (the crossing), Harajuku and Meiji Shrine." },
        { es: "Shinjuku de noche y mirador gratis del gobierno metropolitano.", en: "Shinjuku at night and the free Metropolitan Government observatory." },
      ],
    },
    {
      titulo: { es: "Días 4–5: Kioto", en: "Days 4–5: Kyoto" },
      actividades: [
        { es: "Shinkansen Tokio–Kioto (unas 2 h 15 min).", en: "Shinkansen Tokyo–Kyoto (about 2 h 15 min)." },
        { es: "Fushimi Inari temprano, Kiyomizu-dera y Gion.", en: "Fushimi Inari early, Kiyomizu-dera and Gion." },
        { es: "Bosque de bambú de Arashiyama y Kinkaku-ji.", en: "Arashiyama bamboo grove and Kinkaku-ji." },
      ],
    },
    {
      titulo: { es: "Día 6: Nara", en: "Day 6: Nara" },
      actividades: [
        { es: "Tren local desde Kioto (unos 45 minutos).", en: "Local train from Kyoto (about 45 minutes)." },
        { es: "Templo Todai-ji y el parque de los ciervos.", en: "Todai-ji temple and the deer park." },
      ],
    },
    {
      titulo: { es: "Día 7: Osaka", en: "Day 7: Osaka" },
      actividades: [
        { es: "Castillo de Osaka.", en: "Osaka Castle." },
        { es: "Comer en Dotonbori (takoyaki y okonomiyaki) y vuelo de regreso desde Kansai.", en: "Eat in Dotonbori (takoyaki and okonomiyaki) and fly home from Kansai." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "JR Pass de 7 días (ordinario / Green)", en: "7-day JR Pass (ordinary / Green)" }, monto: { es: "¥53.000 / ¥74.000", en: "¥53,000 / ¥74,000" }, enlace: "https://japanrailpass.net", verificado: true },
    { concepto: { es: "Shinkansen Tokio–Kioto, solo ida (sin pase)", en: "Shinkansen Tokyo–Kyoto, one way (no pass)" }, monto: { es: "≈ ¥14.000", en: "≈ ¥14,000" } },
    { concepto: { es: "Tarjeta de transporte (Suica/ICOCA): viaje en metro", en: "Transit card (Suica/ICOCA): metro ride" }, monto: { es: "¥180–300", en: "¥180–300" } },
    { concepto: { es: "Ramen / comida de konbini", en: "Ramen / konbini meal" }, monto: { es: "¥1.000–1.500 / ¥600–900", en: "¥1,000–1,500 / ¥600–900" } },
    { concepto: { es: "Templos (Kiyomizu-dera, Kinkaku-ji)", en: "Temples (Kiyomizu-dera, Kinkaku-ji)" }, monto: { es: "¥400–500 cada uno", en: "¥400–500 each" } },
    { concepto: { es: "Cama en hostel / hotel business (noche)", en: "Hostel bed / business hotel (night)" }, monto: { es: "¥4.000–6.500 / ¥12.000–22.000", en: "¥4,000–6,500 / ¥12,000–22,000" } },
  ],
  porDia: { economico: [90, 130], equilibrado: [200, 280], premium: [450, 700] },
  consejos: [
    { es: "Para esta ruta (Tokio → Kioto → Osaka, solo ida) el JR Pass de 7 días no conviene: comprá los tickets sueltos. Conviene si hacés ida y vuelta o más ciudades lejanas.", en: "For this route (Tokyo → Kyoto → Osaka, one way) the 7-day JR Pass doesn't pay off: buy single tickets. It's worth it for return trips or more distant cities." },
    { es: "Cargá una tarjeta Suica o ICOCA en el celular: sirve para trenes, buses y konbinis.", en: "Load a Suica or ICOCA card on your phone: it works on trains, buses and at konbinis." },
    { es: "En Japón no se deja propina.", en: "There is no tipping in Japan." },
    { es: "Mandá la valija entre hoteles con takkyubin y viajá liviano en el tren.", en: "Send your suitcase between hotels with takkyubin and ride the train light." },
  ],
};
