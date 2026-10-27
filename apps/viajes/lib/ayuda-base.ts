import type { Idioma } from "./idioma";

/**
 * Ficha de ayuda: lo único que el asistente afirma sobre Rumbo Traveling.
 * Cada respuesta está controlada contra la web real. Si cambia algo de la web, se cambia acá.
 * Sin clave de Claude, el chat responde directo desde esta ficha; con clave, la IA la usa como única fuente.
 */
export interface EntradaAyuda {
  id: string;
  pregunta: string;
  /** Palabras (sin tildes, en minúscula) que suelen aparecer al preguntar esto. */
  claves: string[];
  respuesta: string;
  /** Saludos y agradecimientos: solo ganan si la pregunta no trae otro tema. */
  secundaria?: boolean;
}

const es: EntradaAyuda[] = [
  {
    id: "armar",
    pregunta: "¿Cómo armo mi viaje?",
    claves: ["armo", "armar", "planificar", "planifico", "empezar", "empiezo", "como funciona", "como se usa", "usar", "crear", "pasos", "preguntas", "itinerario"],
    respuesta:
      "Tocá \"Planificar viaje\" (arriba a la derecha) y contestá 7 pasos:\n" +
      "1. Destino: tu ciudad de salida y a dónde van (una ciudad o un país).\n" +
      "2. Fechas: ida y vuelta, o solo la cantidad de días (de 2 a 60).\n" +
      "3. Viajeros: el nombre de cada uno (hasta 12).\n" +
      "4. Presupuesto: máximo y mínimo opcional en US$, por persona o para el grupo.\n" +
      "5. Vuelo: aerolínea preferida, clase y equipaje.\n" +
      "6. Alojamiento: hostel, hotel de 3, 4 o 5 estrellas o departamento.\n" +
      "7. Estilo: económico, equilibrado o premium.\n" +
      "Al final tocá \"Armar mi viaje\" y ves el itinerario con vuelos, hoteles, clima y el total.",
  },
  {
    id: "aeropuerto",
    pregunta: "¿Cómo elijo el aeropuerto?",
    claves: ["aeropuerto", "aeropuertos", "ciudad de salida", "salgo", "salida", "origen", "desde donde", "cerca", "cercano"],
    respuesta:
      "En el paso 1 escribí tu ciudad y elegila de la lista. Te mostramos los aeropuertos cercanos con la distancia de cada uno; " +
      "el más cercano queda marcado, pero podés elegir otro. Con el destino pasa lo mismo. " +
      "Si no hay aeropuertos con vuelos regulares cerca, probá con una ciudad más grande cercana.",
  },
  {
    id: "pais",
    pregunta: "¿Puedo poner solo un país?",
    claves: ["pais", "solo el pais", "varias ciudades", "ciudades", "varios destinos", "destinos", "recorrido", "ruta", "no se a que ciudad"],
    respuesta:
      "Sí. Si en el destino elegís un país, Rumbo te sugiere qué ciudades visitar y cuántas noches en cada una según los días que tenés, " +
      "con los traslados entre ciudades y su precio aproximado.",
  },
  {
    id: "fechas",
    pregunta: "¿Y si no tengo fechas?",
    claves: ["fecha", "fechas", "cuando", "dias", "duracion", "no tengo fecha", "60"],
    respuesta:
      "En el paso 2 elegí \"Solo sé cuántos días\" y poné la cantidad (de 2 a 60). Usamos una fecha tentativa dentro de 30 días, " +
      "que después podés cambiar. Por ahora armamos viajes de hasta 60 días.",
  },
  {
    id: "etiquetas",
    pregunta: "¿Qué significa precio estimado?",
    claves: ["estimado", "verificado", "no verificado", "etiqueta", "significa", "fuente", "confirmado", "de donde sale"],
    respuesta:
      "Cada precio muestra de dónde sale, cuándo se consultó y una etiqueta:\n" +
      "• Verificado: un segundo agente lo confirmó.\n" +
      "• Precio estimado: es un cálculo aproximado, no una tarifa confirmada.\n" +
      "• No verificado: no se pudo confirmar.\n" +
      "Hoy la web todavía muestra datos de ejemplo, así que tomá los precios como referencia.",
  },
  {
    id: "ejemplo",
    pregunta: "¿Los precios son reales?",
    claves: ["real", "reales", "ejemplo", "exacto", "actualizado", "precio", "precios", "cuanto sale", "cuanto cuesta", "disponibilidad"],
    respuesta:
      "Todavía no son reales: por ahora los precios, el clima y la disponibilidad son datos de ejemplo, para que veas cómo queda tu viaje armado. " +
      "La conexión con precios y clima reales llega en la próxima etapa. Antes de pagar, confirmá siempre el precio en el sitio donde reserves.",
  },
  {
    id: "reservar",
    pregunta: "¿Rumbo cobra o reserva?",
    claves: ["reservar", "reserva", "reservo", "comprar", "compro", "pagar", "pago", "cobra", "cobran", "tarjeta", "pasaje", "pasajes"],
    respuesta:
      "No. Rumbo no cobra ni reserva nada. El botón \"Reservar\" de cada vuelo u hotel abre una búsqueda en Google (Vuelos o Hoteles), " +
      "y la compra la hacés directo en el sitio que elijas.",
  },
  {
    id: "gratis",
    pregunta: "¿Usar Rumbo cuesta algo?",
    claves: ["gratis", "gratuito", "cuesta usar", "suscripcion", "registrarme", "registro", "cuenta", "usuario"],
    respuesta: "Es gratis y no hace falta registrarse ni crear una cuenta.",
  },
  {
    id: "presupuesto",
    pregunta: "¿Cómo calcula el presupuesto?",
    claves: ["presupuesto", "total", "por persona", "se pasa", "excede", "incluye", "gasto", "comida", "transporte"],
    respuesta:
      "El total suma vuelos, alojamiento con impuestos, traslados entre ciudades, actividades, comida y transporte local " +
      "(estos dos últimos con un monto aproximado por día). Ves el total del viaje y por persona, y te avisa si se pasa del máximo " +
      "o queda por debajo del mínimo que pusiste. Todo está en dólares (US$).",
  },
  {
    id: "elegir",
    pregunta: "¿Cómo cambio el vuelo o el hotel?",
    claves: ["cambiar vuelo", "otro vuelo", "otro hotel", "cambiar hotel", "opciones", "elegir", "elijo", "opcion"],
    respuesta:
      "En tu viaje armado hay varias opciones de vuelo y de hotel, cada una con sus condiciones (equipaje, cambios, reembolso, desayuno, " +
      "cancelación y horarios de check-in y check-out). Tocá \"Elegir\" en la que prefieras y el total se actualiza solo.",
  },
  {
    id: "actividades",
    pregunta: "¿Puedo cambiar las actividades?",
    claves: ["actividad", "actividades", "sacar", "sumar", "agregar", "quitar", "plan del dia", "que hacer"],
    respuesta:
      "Sí. En el itinerario día por día podés sacar una actividad o tocar \"Sumar actividad\" para agregar una sugerida. " +
      "Las actividades se acomodan según el clima: las de bajo techo van los días con lluvia.",
  },
  {
    id: "clima",
    pregunta: "¿Cómo funciona el clima?",
    claves: ["clima", "lluvia", "llueve", "pronostico", "temperatura", "tiempo", "frio", "calor"],
    respuesta:
      "Cada día del itinerario muestra el pronóstico de esa ciudad. Si falta más de 10 días, queda marcado como de baja confianza " +
      "y se actualiza a medida que se acerca la fecha. Recordá que por ahora son datos de ejemplo.",
  },
  {
    id: "cambiar",
    pregunta: "¿Cómo cambio mis respuestas?",
    claves: ["cambiar respuestas", "corregir", "modificar", "edito", "editar", "me equivoque", "volver"],
    respuesta: "En la página de tu viaje tocá \"Cambiar respuestas\": volvés a las preguntas con lo que ya habías puesto.",
  },
  {
    id: "guardar",
    pregunta: "¿Puedo guardar o compartir el viaje?",
    claves: ["guardar", "guardo", "compartir", "comparto", "enviar", "mandar", "link", "whatsapp", "perdi", "se borro"],
    respuesta:
      "Guardar, sí: en tu viaje armado tocá \"Guardar viaje\" y lo vas a ver en la portada cada vez que entres. " +
      "Queda solo en este dispositivo y navegador, y nadie más lo ve; si cambiás el vuelo, el hotel o las actividades, se guarda solo. " +
      "Compartir el viaje con otras personas todavía no se puede: llega pronto.",
  },
  {
    id: "gastos",
    pregunta: "¿Cómo se dividen los gastos?",
    claves: ["dividir", "divido", "gastos compartidos", "compartidos", "quien paga", "deber", "deuda", "split"],
    respuesta:
      "Hoy ves el total y cuánto le toca a cada persona. La calculadora de gastos compartidos (anotar quién pagó qué y quién le debe a quién) " +
      "llega pronto; para eso usamos los nombres de los viajeros.",
  },
  {
    id: "idioma",
    pregunta: "¿Cómo cambio el idioma?",
    claves: ["idioma", "ingles", "english", "espanol", "lenguaje"],
    respuesta: "Arriba a la derecha tocá ES (español) o EN (inglés). Tu viaje se traduce sin perder lo que elegiste.",
  },
  {
    id: "muestra",
    pregunta: "¿Qué es \"Ver un ejemplo\"?",
    claves: ["ver un ejemplo", "muestra", "demo", "viaje de ejemplo"],
    respuesta: "Es un viaje ya armado (5 días en China, 3 viajeros) para que veas cómo queda todo antes de contestar las preguntas.",
  },
  {
    id: "requisitos",
    pregunta: "¿Qué necesito para entrar al país?",
    claves: ["visa", "visado", "pasaporte", "vacuna", "vacunas", "requisito", "requisitos", "entrar", "migracion", "seguro"],
    respuesta:
      "Rumbo no informa sobre visas, vacunas ni requisitos de entrada. Consultalo en fuentes oficiales: el consulado o la cancillería del país " +
      "y tu aerolínea, porque cambian seguido y dependen de tu nacionalidad.",
  },
  {
    id: "contacto",
    pregunta: "¿Quién hizo Rumbo?",
    claves: ["quien", "creador", "creo", "hizo", "contacto", "dueno", "empresa"],
    respuesta: "Rumbo Traveling es un proyecto creado por Pascual Pepa.",
  },
  {
    id: "ninos",
    pregunta: "¿Puedo viajar con niños?",
    claves: ["nino", "ninos", "hijo", "hijos", "hija", "hijas", "bebe", "bebes", "chicos", "menor", "menores", "familia", "edad", "edades"],
    respuesta:
      "Sí: sumá a cada persona como viajero en el paso 3. Por ahora no distinguimos edades, así que los precios se calculan como si todos fueran adultos. " +
      "Las tarifas para niños y bebés las ves al reservar en el sitio de la aerolínea o del hotel.",
  },
  {
    id: "recomendaciones",
    pregunta: "¿Qué me recomendás hacer?",
    claves: ["que hago", "que hacer", "que ver", "que visitar", "lugares", "recomendas", "recomendacion", "recomendaciones", "conocer", "imperdible", "imperdibles", "comer"],
    respuesta:
      "Armá tu viaje y en el itinerario día por día vas a ver actividades sugeridas para cada ciudad: imperdibles, comida típica y experiencias, " +
      "acomodadas según el clima. Podés sacar las que no te interesen o sumar otras.",
  },
  {
    id: "alojamiento",
    pregunta: "¿Qué tipos de alojamiento hay?",
    claves: ["hotel", "hoteles", "hostel", "hostels", "departamento", "airbnb", "alojamiento", "dormir", "barato", "baratos", "barata", "economico", "lujo", "estrellas"],
    respuesta:
      "En el paso 6 elegís hostel, hotel de 3, 4 o 5 estrellas o departamento, y si querés, el nombre de un hotel que ya tengas en mente. " +
      "Para gastar menos, elegí hostel o 3 estrellas y el estilo \"Económico\" en el paso 7. Cada hotel muestra el precio con impuestos y sus condiciones.",
  },
  {
    id: "saludo",
    secundaria: true,
    pregunta: "Hola",
    claves: ["hola", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "hey"],
    respuesta: "¡Hola! Te ayudo a usar Rumbo Traveling. Preguntame, por ejemplo, cómo armar tu viaje, cómo elegir el aeropuerto o si los precios son reales.",
  },
  {
    id: "gracias",
    secundaria: true,
    pregunta: "Gracias",
    claves: ["gracias", "genial", "perfecto", "listo", "joya", "buenisimo"],
    respuesta: "¡De nada! Si te surge otra duda, acá estoy. Buen viaje.",
  },
];

const en: EntradaAyuda[] = [
  {
    id: "armar",
    pregunta: "How do I plan my trip?",
    claves: ["plan", "planning", "start", "how does it work", "how to use", "use", "create", "steps", "questions", "itinerary", "build"],
    respuesta:
      "Tap \"Plan a trip\" (top right) and answer 7 steps:\n" +
      "1. Destination: where you leave from and where you're going (a city or a country).\n" +
      "2. Dates: departure and return, or just the number of days (2 to 60).\n" +
      "3. Travelers: each person's name (up to 12).\n" +
      "4. Budget: a maximum and optional minimum in US$, per person or for the group.\n" +
      "5. Flight: preferred airline, class and baggage.\n" +
      "6. Stay: hostel, 3, 4 or 5-star hotel, or apartment.\n" +
      "7. Style: budget, balanced or premium.\n" +
      "Then tap \"Build my trip\" to see the itinerary with flights, hotels, weather and the total.",
  },
  {
    id: "aeropuerto",
    pregunta: "How do I pick the airport?",
    claves: ["airport", "airports", "leave from", "departure city", "origin", "nearest", "near", "close"],
    respuesta:
      "In step 1, type your city and pick it from the list. We show nearby airports with the distance to each; the nearest is selected, " +
      "but you can choose another. The destination works the same way. If there are no airports with regular flights nearby, try a larger nearby city.",
  },
  {
    id: "pais",
    pregunta: "Can I enter just a country?",
    claves: ["country", "just the country", "several cities", "cities", "several destinations", "destinations", "route", "which city"],
    respuesta:
      "Yes. If you pick a country as the destination, Rumbo suggests which cities to visit and how many nights in each based on your days, " +
      "including the transfers between cities and their approximate price.",
  },
  {
    id: "fechas",
    pregunta: "What if I don't have dates?",
    claves: ["date", "dates", "when", "days", "length", "no dates", "60"],
    respuesta:
      "In step 2 choose \"I only know how many days\" and enter the number (2 to 60). We use a tentative date about 30 days from now, " +
      "which you can change later. For now, trips can be up to 60 days.",
  },
  {
    id: "etiquetas",
    pregunta: "What does estimated price mean?",
    claves: ["estimated", "verified", "not verified", "label", "mean", "means", "source", "confirmed", "where does"],
    respuesta:
      "Every price shows where it comes from, when it was checked and a label:\n" +
      "• Verified: a second agent confirmed it.\n" +
      "• Estimated price: an approximate calculation, not a confirmed fare.\n" +
      "• Not verified: it couldn't be confirmed.\n" +
      "The site still shows sample data today, so treat prices as a reference.",
  },
  {
    id: "ejemplo",
    pregunta: "Are the prices real?",
    claves: ["real", "sample", "exact", "up to date", "price", "prices", "how much", "cost", "availability"],
    respuesta:
      "They aren't real yet: for now prices, weather and availability are sample data, so you can see how your trip comes together. " +
      "Real prices and weather come in the next stage. Before paying, always confirm the price on the site where you book.",
  },
  {
    id: "reservar",
    pregunta: "Does Rumbo charge or book anything?",
    claves: ["book", "booking", "buy", "pay", "payment", "charge", "charges", "card", "ticket", "tickets"],
    respuesta:
      "No. Rumbo doesn't charge or book anything. The \"Book\" button on each flight or hotel opens a Google search (Flights or Hotels), " +
      "and you buy directly on the site you choose.",
  },
  {
    id: "gratis",
    pregunta: "Does it cost anything to use Rumbo?",
    claves: ["free", "cost to use", "subscription", "sign up", "register", "account", "login"],
    respuesta: "It's free, and you don't need to sign up or create an account.",
  },
  {
    id: "presupuesto",
    pregunta: "How is the budget calculated?",
    claves: ["budget", "total", "per person", "over budget", "exceeds", "include", "includes", "food", "transport"],
    respuesta:
      "The total adds up flights, lodging with taxes, transfers between cities, activities, food and local transport " +
      "(the last two as an approximate daily amount). You see the trip total and the amount per person, and you're told if it goes over your maximum " +
      "or stays under your minimum. Everything is in US dollars.",
  },
  {
    id: "elegir",
    pregunta: "How do I change the flight or hotel?",
    claves: ["change flight", "another flight", "another hotel", "change hotel", "options", "choose", "pick", "option"],
    respuesta:
      "Your trip has several flight and hotel options, each with its conditions (baggage, changes, refunds, breakfast, cancellation and " +
      "check-in and check-out times). Tap \"Choose\" on the one you prefer and the total updates on its own.",
  },
  {
    id: "actividades",
    pregunta: "Can I change the activities?",
    claves: ["activity", "activities", "remove", "add", "delete", "things to do", "what to do"],
    respuesta:
      "Yes. In the day-by-day itinerary you can remove an activity or tap \"Add activity\" to add a suggested one. " +
      "Activities are arranged by the weather: indoor ones go on rainy days.",
  },
  {
    id: "clima",
    pregunta: "How does the weather work?",
    claves: ["weather", "rain", "forecast", "temperature", "cold", "hot"],
    respuesta:
      "Each day of the itinerary shows the forecast for that city. If it's more than 10 days away, it's marked as low confidence " +
      "and updates as the date gets closer. Remember that for now it's sample data.",
  },
  {
    id: "cambiar",
    pregunta: "How do I change my answers?",
    claves: ["change my answers", "change answers", "fix", "edit", "modify", "mistake", "go back"],
    respuesta: "On your trip page, tap \"Change answers\": you go back to the questions with what you had already entered.",
  },
  {
    id: "guardar",
    pregunta: "Can I save or share my trip?",
    claves: ["save", "share", "send", "link", "whatsapp", "lost", "deleted"],
    respuesta:
      "Saving, yes: on your trip tap \"Save trip\" and you'll see it on the home page every time you visit. " +
      "It stays on this device and browser only, and nobody else can see it; if you change the flight, hotel or activities, it saves on its own. " +
      "Sharing a trip with other people isn't available yet: it's coming soon.",
  },
  {
    id: "gastos",
    pregunta: "How are expenses split?",
    claves: ["split", "splitting", "shared expenses", "shared", "who pays", "owe", "debt"],
    respuesta:
      "Today you see the total and each person's share. The shared-expenses calculator (logging who paid what and who owes whom) " +
      "is coming soon; that's what the travelers' names are for.",
  },
  {
    id: "idioma",
    pregunta: "How do I change the language?",
    claves: ["language", "spanish", "english", "espanol"],
    respuesta: "At the top right, tap ES (Spanish) or EN (English). Your trip is translated without losing your choices.",
  },
  {
    id: "muestra",
    pregunta: "What is \"See an example\"?",
    claves: ["see an example", "example", "sample trip", "demo"],
    respuesta: "It's a ready-made trip (5 days in China, 3 travelers) so you can see how everything looks before answering the questions.",
  },
  {
    id: "requisitos",
    pregunta: "What do I need to enter the country?",
    claves: ["visa", "passport", "vaccine", "vaccines", "requirement", "requirements", "entry", "immigration", "insurance"],
    respuesta:
      "Rumbo doesn't give information on visas, vaccines or entry requirements. Check official sources: the country's consulate or " +
      "foreign ministry and your airline, since they change often and depend on your nationality.",
  },
  {
    id: "contacto",
    pregunta: "Who made Rumbo?",
    claves: ["who", "creator", "created", "made", "contact", "owner", "company"],
    respuesta: "Rumbo Traveling is a project created by Pascual Pepa.",
  },
  {
    id: "ninos",
    pregunta: "Can I travel with kids?",
    claves: ["kid", "kids", "child", "children", "son", "daughter", "baby", "babies", "minor", "minors", "family", "age", "ages"],
    respuesta:
      "Yes: add each person as a traveler in step 3. For now we don't distinguish ages, so prices are calculated as if everyone were an adult. " +
      "You'll see child and infant fares when booking on the airline or hotel site.",
  },
  {
    id: "recomendaciones",
    pregunta: "What do you recommend doing?",
    claves: ["what to do", "what to see", "things to see", "places", "recommend", "recommendation", "recommendations", "visit", "must see", "eat"],
    respuesta:
      "Build your trip and the day-by-day itinerary shows suggested activities for each city: must-sees, local food and experiences, " +
      "arranged by the weather. You can remove the ones you don't like or add others.",
  },
  {
    id: "alojamiento",
    pregunta: "What kinds of lodging are there?",
    claves: ["hotel", "hotels", "hostel", "hostels", "apartment", "airbnb", "lodging", "stay", "sleep", "cheap", "budget hotel", "luxury", "stars"],
    respuesta:
      "In step 6 you choose a hostel, a 3, 4 or 5-star hotel or an apartment, and optionally the name of a hotel you already have in mind. " +
      "To spend less, pick a hostel or 3 stars and the \"Budget\" style in step 7. Each hotel shows its price with taxes and its conditions.",
  },
  {
    id: "saludo",
    secundaria: true,
    pregunta: "Hi",
    claves: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
    respuesta: "Hi! I can help you use Rumbo Traveling. Ask me, for example, how to plan your trip, how to pick the airport or whether prices are real.",
  },
  {
    id: "gracias",
    secundaria: true,
    pregunta: "Thanks",
    claves: ["thanks", "thank you", "great", "perfect", "awesome", "cool"],
    respuesta: "You're welcome! If anything else comes up, I'm here. Have a great trip.",
  },
];

export const BASE_AYUDA: Record<Idioma, EntradaAyuda[]> = { es, en };

export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Busca la entrada que mejor responde la pregunta. Las frases largas pesan más que las palabras sueltas,
 * y una coincidencia exacta con la pregunta de la ficha gana siempre. Devuelve null si nada coincide.
 */
export function buscarAyuda(pregunta: string, idioma: Idioma): EntradaAyuda | null {
  const texto = ` ${normalizar(pregunta)} `;
  if (!texto.trim()) return null;
  let mejor: EntradaAyuda | null = null;
  let mejorPuntos = 0;
  for (const entrada of BASE_AYUDA[idioma]) {
    if (normalizar(entrada.pregunta) === texto.trim()) return entrada;
    let puntos = 0;
    for (const clave of entrada.claves) {
      if (texto.includes(` ${clave} `)) puntos += clave.split(" ").length;
    }
    if (entrada.secundaria) puntos = Math.min(puntos, 0.5);
    if (puntos > mejorPuntos) {
      mejor = entrada;
      mejorPuntos = puntos;
    }
  }
  return mejor;
}

/** La ficha en texto plano, para dársela a la IA como única fuente sobre la web. */
export function fichaComoTexto(idioma: Idioma) {
  return BASE_AYUDA[idioma].map((e) => `P: ${e.pregunta}\nR: ${e.respuesta}`).join("\n\n");
}
