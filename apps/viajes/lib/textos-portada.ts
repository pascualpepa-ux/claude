import type { Idioma } from "./idioma";

// Textos nuevos de la portada (foto, destinos con foto y cómo funciona), en español y en inglés.

export const PORTADA = {
  es: {
    cejilla: "Planificador de viajes gratis",
    sellos: ["Gratis", "Sin registrarte", "Clima real", "Cada precio con su fuente"],
    destinosTitulo: "Destinos para inspirarte",
    destinosBajada: "Itinerario día por día y cuánto cuesta cada ciudad, con precios revisados.",
    desde: (n: number) => `desde US$ ${n} por día`,
    dias: (n: number) => `${n} días`,
    todas: "Ver todas las guías",
    comoTitulo: "Tu viaje listo en 3 pasos",
    pasos: [
      { titulo: "Contanos tu viaje", texto: "Adónde, cuándo, con quién y qué presupuesto tenés." },
      { titulo: "Lo armamos por vos", texto: "Itinerario día por día con vuelos, hotel, clima real y lo que cuesta cada cosa." },
      { titulo: "Ajustalo y viajá", texto: "Cambiá actividades, dividí los gastos del grupo y recibí avisos si algo cambia." },
    ],
    empezar: "Empezar ahora",
    fotos: "Fotos: Unsplash",
  },
  en: {
    cejilla: "Free trip planner",
    sellos: ["Free", "No sign-up", "Real weather", "Every price with its source"],
    destinosTitulo: "Destinations to inspire you",
    destinosBajada: "Day-by-day itineraries and what each city costs, with reviewed prices.",
    desde: (n: number) => `from US$ ${n} per day`,
    dias: (n: number) => `${n} days`,
    todas: "See all guides",
    comoTitulo: "Your trip ready in 3 steps",
    pasos: [
      { titulo: "Tell us about your trip", texto: "Where, when, who's coming and your budget." },
      { titulo: "We plan it for you", texto: "A day-by-day itinerary with flights, hotel, real weather and what everything costs." },
      { titulo: "Adjust it and go", texto: "Swap activities, split group expenses and get alerts if something changes." },
    ],
    empezar: "Start now",
    fotos: "Photos: Unsplash",
  },
} satisfies Record<Idioma, unknown>;
