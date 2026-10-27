import type { Guia } from "./tipos";

export const roma: Guia = {
  slug: "roma-3-dias",
  dias: 3,
  claves: ["roma","rome","coliseo","colosseum","vaticano","vatican"],
  destino: { buscar: "Roma", pais: "IT", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en Roma en 3 días", en: "What to do in Rome in 3 days" },
  descripcion: {
    es: "Itinerario de 3 días en Roma: Coliseo, Vaticano, Trastevere y fuentes, con precios de entradas verificados y consejos para ahorrar.",
    en: "A 3-day Rome itinerary: Colosseum, Vatican, Trastevere and fountains, with verified ticket prices and tips to save money.",
  },
  intro: {
    es: "Tres días alcanzan para ver la Roma antigua, el Vaticano y los barrios con más vida, si reservás las entradas grandes con tiempo y caminás mucho. El centro se recorre a pie.",
    en: "Three days are enough for ancient Rome, the Vatican and the liveliest neighbourhoods, if you book the big tickets ahead and walk a lot. The centre is best seen on foot.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: la Roma antigua", en: "Day 1: ancient Rome" },
      actividades: [
        { es: "Coliseo a primera hora (con horario reservado).", en: "Colosseum first thing (with a timed booking)." },
        { es: "Foro Romano y monte Palatino (misma entrada).", en: "Roman Forum and Palatine Hill (same ticket)." },
        { es: "Tarde: Plaza Venecia, Capitolio y vista desde el Vittoriano.", en: "Afternoon: Piazza Venezia, the Capitoline and the view from the Vittoriano." },
        { es: "Cena en el barrio de Monti.", en: "Dinner in the Monti neighbourhood." },
      ],
    },
    {
      titulo: { es: "Día 2: Vaticano y Trastevere", en: "Day 2: Vatican and Trastevere" },
      actividades: [
        { es: "Museos Vaticanos y Capilla Sixtina (reserva online).", en: "Vatican Museums and Sistine Chapel (book online)." },
        { es: "Basílica de San Pedro (gratis; se puede subir a la cúpula pagando aparte).", en: "St Peter's Basilica (free; the dome climb is paid separately)." },
        { es: "Castel Sant'Angelo por fuera y cruce del río.", en: "Castel Sant'Angelo from outside and across the river." },
        { es: "Atardecer y cena en Trastevere.", en: "Sunset and dinner in Trastevere." },
      ],
    },
    {
      titulo: { es: "Día 3: plazas y fuentes", en: "Day 3: squares and fountains" },
      actividades: [
        { es: "Panteón temprano.", en: "Pantheon early." },
        { es: "Plaza Navona, Campo de' Fiori y Fontana di Trevi.", en: "Piazza Navona, Campo de' Fiori and the Trevi Fountain." },
        { es: "Escalinata de Plaza de España y paseo por Villa Borghese.", en: "Spanish Steps and a walk through Villa Borghese." },
        { es: "Si querés un museo más: Galería Borghese (cupos limitados, reservar).", en: "If you want one more museum: Borghese Gallery (limited slots, book ahead)." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Coliseo + Foro + Palatino", en: "Colosseum + Forum + Palatine" }, monto: { es: "€18 (+€2 de reserva online)", en: "€18 (+€2 online booking fee)" }, enlace: "https://ticketing.colosseo.it", verificado: true },
    { concepto: { es: "Museos Vaticanos + Capilla Sixtina", en: "Vatican Museums + Sistine Chapel" }, monto: { es: "€20 + €5 de reserva online", en: "€20 + €5 online booking" }, enlace: "https://tickets.museivaticani.va", verificado: true },
    { concepto: { es: "Panteón", en: "Pantheon" }, monto: { es: "≈ €5", en: "≈ €5" } },
    { concepto: { es: "Boleto de metro/bus (100 minutos)", en: "Metro/bus ticket (100 minutes)" }, monto: { es: "≈ €1,50", en: "≈ €1.50" } },
    { concepto: { es: "Tren Leonardo Express (aeropuerto Fiumicino)", en: "Leonardo Express train (Fiumicino airport)" }, monto: { es: "≈ €14", en: "≈ €14" } },
    { concepto: { es: "Pizza al taglio o supplì", en: "Pizza al taglio or supplì" }, monto: { es: "€5–10", en: "€5–10" } },
    { concepto: { es: "Cena en trattoria", en: "Trattoria dinner" }, monto: { es: "€25–40", en: "€25–40" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "€35–55 / €120–190", en: "€35–55 / €120–190" } },
  ],
  porDia: { economico: [80, 110], equilibrado: [180, 250], premium: [400, 600] },
  consejos: [
    { es: "Reservá el Coliseo y el Vaticano apenas tengas fechas: los horarios buenos se agotan.", en: "Book the Colosseum and the Vatican as soon as you have dates: good time slots sell out." },
    { es: "Para entrar a las iglesias (y al Vaticano) hay que tener hombros y rodillas cubiertos.", en: "To enter churches (and the Vatican) shoulders and knees must be covered." },
    { es: "El agua de las fuentes públicas (nasoni) es potable: llevá una botella.", en: "Water from the public fountains (nasoni) is drinkable: bring a bottle." },
    { es: "Los hoteles cobran una tasa turística por noche que se paga aparte.", en: "Hotels charge a nightly tourist tax that is paid separately." },
  ],
};
