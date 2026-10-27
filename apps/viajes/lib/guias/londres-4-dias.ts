import type { Guia } from "./tipos";

export const londres: Guia = {
  slug: "londres-4-dias",
  dias: 4,
  claves: ["londres","london"],
  destino: { buscar: "London", pais: "GB", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Londres en 4 días", en: "What to do in London in 4 days" },
  descripcion: {
    es: "Itinerario de 4 días en Londres: Westminster, Torre de Londres, museos gratis, Camden y Notting Hill, con precios aproximados y consejos.",
    en: "A 4-day London itinerary: Westminster, the Tower of London, free museums, Camden and Notting Hill, with approximate prices and tips.",
  },
  intro: {
    es: "Londres es cara para dormir pero tiene muchísimo gratis: los grandes museos no cobran entrada. En cuatro días ves lo clásico, los mercados y un par de barrios distintos.",
    en: "London is expensive to sleep in but much of it is free: the major museums charge no entry. In four days you see the classics, the markets and a couple of very different neighbourhoods.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: Westminster", en: "Day 1: Westminster" },
      actividades: [
        { es: "Big Ben, Parlamento y Abadía de Westminster.", en: "Big Ben, Parliament and Westminster Abbey." },
        { es: "Cambio de guardia en el Palacio de Buckingham (revisá los días).", en: "Changing of the Guard at Buckingham Palace (check the days)." },
        { es: "St James's Park, Trafalgar Square y National Gallery (gratis).", en: "St James's Park, Trafalgar Square and the National Gallery (free)." },
      ],
    },
    {
      titulo: { es: "Día 2: la City y el río", en: "Day 2: the City and the river" },
      actividades: [
        { es: "Torre de Londres y las Joyas de la Corona.", en: "Tower of London and the Crown Jewels." },
        { es: "Tower Bridge y paseo por la orilla sur.", en: "Tower Bridge and a walk along the South Bank." },
        { es: "Borough Market y Tate Modern (gratis).", en: "Borough Market and Tate Modern (free)." },
      ],
    },
    {
      titulo: { es: "Día 3: museos de Kensington", en: "Day 3: Kensington museums" },
      actividades: [
        { es: "Museo Británico por la mañana (gratis).", en: "British Museum in the morning (free)." },
        { es: "Museo de Historia Natural o Victoria & Albert (gratis).", en: "Natural History Museum or the V&A (free)." },
        { es: "Hyde Park y noche en el West End (teatro).", en: "Hyde Park and an evening in the West End (theatre)." },
      ],
    },
    {
      titulo: { es: "Día 4: mercados y barrios", en: "Day 4: markets and neighbourhoods" },
      actividades: [
        { es: "Notting Hill y Portobello Road (sábado, día de mercado grande).", en: "Notting Hill and Portobello Road (Saturday is the big market day)." },
        { es: "Camden Market y Regent's Canal.", en: "Camden Market and Regent's Canal." },
        { es: "Vista gratis desde Sky Garden (reserva previa).", en: "Free view from the Sky Garden (book ahead)." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Torre de Londres", en: "Tower of London" }, monto: { es: "≈ £35", en: "≈ £35" }, enlace: "https://www.hrp.org.uk/tower-of-london/" },
    { concepto: { es: "Abadía de Westminster", en: "Westminster Abbey" }, monto: { es: "≈ £30", en: "≈ £30" } },
    { concepto: { es: "Museo Británico, National Gallery, Tate Modern", en: "British Museum, National Gallery, Tate Modern" }, monto: { es: "Gratis", en: "Free" } },
    { concepto: { es: "Metro con tarjeta sin contacto (tope diario zonas 1–2)", en: "Tube with contactless (daily cap, zones 1–2)" }, monto: { es: "≈ £9", en: "≈ £9" } },
    { concepto: { es: "Pub: plato y bebida", en: "Pub: main and a drink" }, monto: { es: "£20–30", en: "£20–30" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "£35–60 / £150–250", en: "£35–60 / £150–250" } },
  ],
  porDia: { economico: [110, 150], equilibrado: [250, 330], premium: [500, 800] },
  consejos: [
    { es: "Pagá el transporte con tarjeta o celular sin contacto: se aplica solo el tope diario.", en: "Pay for transport with a contactless card or phone: the daily cap applies automatically." },
    { es: "Usá siempre la misma tarjeta para entrar y salir del metro, si no, te cobra de más.", en: "Always tap in and out with the same card, or you'll be overcharged." },
    { es: "Muchos teatros venden entradas de último momento más baratas el mismo día.", en: "Many theatres sell cheaper last-minute tickets on the day." },
  ],
};
