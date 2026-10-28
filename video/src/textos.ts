export type Idioma = "es" | "en";

export const TEXTOS = {
  es: {
    pregunta: "¿Planeando un viaje?",
    itinerario: { cejilla: "Itinerario", titulo: "Armá tu itinerario día por día", bajada: "Actividades y el clima de cada día, listos en minutos." },
    todo: { cejilla: "Todo junto", titulo: "Vuelos, hoteles y clima en un solo lugar", bajada: "Compará opciones y mirá el total por persona." },
    gastos: { cejilla: "Gastos compartidos", titulo: "Dividí los gastos con tus amigos", bajada: "Y sabé quién le debe a quién, con la menor cantidad de pagos." },
    alertas: {
      cejilla: "Avisos",
      titulo: "Alertas si algo cambia en tu viaje",
      bajada: "Te escribimos por email, por ejemplo si cambia el pronóstico de tu destino.",
      noti: "Cambió el pronóstico de tu viaje",
      notiDetalle: "Pekín, jueves 4: nieve, 1° / -6°",
      ahora: "ahora",
    },
    idiomas: { cejilla: "Idiomas", titulo: "En español e inglés", bajada: "Cambiá de idioma con un toque." },
    cta: "Planificá tu viaje gratis",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    pregunta: "Planning a trip?",
    itinerario: { cejilla: "Itinerary", titulo: "Build your itinerary day by day", bajada: "Activities and each day's weather, ready in minutes." },
    todo: { cejilla: "All in one place", titulo: "Flights, hotels and weather in one place", bajada: "Compare options and see the total per person." },
    gastos: { cejilla: "Shared costs", titulo: "Split costs with your friends", bajada: "And know who owes whom, with the fewest payments." },
    alertas: {
      cejilla: "Alerts",
      titulo: "Alerts if anything changes on your trip",
      bajada: "We email you, for example if your destination's forecast changes.",
      noti: "The forecast for your trip changed",
      notiDetalle: "Beijing, Thursday 4: snow, 1° / -6°",
      ahora: "now",
    },
    idiomas: { cejilla: "Languages", titulo: "In Spanish and English", bajada: "Switch languages in one tap." },
    cta: "Plan your trip for free",
    firma: "A project by Pascual Pepa",
  },
} as const;

export type Textos = (typeof TEXTOS)[Idioma];
