import type { Guia } from "./tipos";

export const paris: Guia = {
  slug: "paris-4-dias",
  dias: 4,
  claves: ["paris","louvre","eiffel","versalles","versailles"],
  destino: { buscar: "Paris", pais: "FR", tipo: "ciudad" },
  revisado: "2026-10",
  titulo: { es: "Qué hacer en París en 4 días", en: "What to do in Paris in 4 days" },
  descripcion: {
    es: "Itinerario de 4 días en París: Louvre, Torre Eiffel, Montmartre, Le Marais y Versalles, con precios de entradas verificados y consejos.",
    en: "A 4-day Paris itinerary: the Louvre, Eiffel Tower, Montmartre, Le Marais and Versailles, with verified ticket prices and tips.",
  },
  intro: {
    es: "Con cuatro días ves lo esencial de París sin correr: los grandes museos, la Torre Eiffel, dos barrios con personalidad y una excursión a Versalles. El metro te lleva a todos lados.",
    en: "Four days let you see Paris's essentials without rushing: the great museums, the Eiffel Tower, two neighbourhoods with character and a day trip to Versailles. The metro takes you everywhere.",
  },
  itinerario: [
    {
      titulo: { es: "Día 1: el centro y la isla de la Cité", en: "Day 1: the centre and Île de la Cité" },
      actividades: [
        { es: "Notre-Dame (entrada gratis) y Sainte-Chapelle.", en: "Notre-Dame (free entry) and Sainte-Chapelle." },
        { es: "Barrio Latino y Jardines de Luxemburgo.", en: "Latin Quarter and Luxembourg Gardens." },
        { es: "Paseo en barco por el Sena al atardecer.", en: "Seine boat ride at sunset." },
      ],
    },
    {
      titulo: { es: "Día 2: Louvre y Champs-Élysées", en: "Day 2: Louvre and Champs-Élysées" },
      actividades: [
        { es: "Museo del Louvre (con horario reservado).", en: "The Louvre (with a timed booking)." },
        { es: "Jardín de las Tullerías y Plaza de la Concordia.", en: "Tuileries Garden and Place de la Concorde." },
        { es: "Champs-Élysées hasta el Arco del Triunfo.", en: "Champs-Élysées up to the Arc de Triomphe." },
      ],
    },
    {
      titulo: { es: "Día 3: Torre Eiffel y Montmartre", en: "Day 3: Eiffel Tower and Montmartre" },
      actividades: [
        { es: "Torre Eiffel temprano y Trocadero para la foto.", en: "Eiffel Tower early and Trocadéro for the photo." },
        { es: "Museo de Orsay (impresionistas).", en: "Musée d'Orsay (Impressionists)." },
        { es: "Tarde en Montmartre y el Sacré-Cœur.", en: "Afternoon in Montmartre and Sacré-Cœur." },
      ],
    },
    {
      titulo: { es: "Día 4: Versalles y Le Marais", en: "Day 4: Versailles and Le Marais" },
      actividades: [
        { es: "Palacio y jardines de Versalles (tren RER C, unos 40 minutos).", en: "Palace and gardens of Versailles (RER C train, about 40 minutes)." },
        { es: "Vuelta a París: Le Marais y Plaza de los Vosgos.", en: "Back in Paris: Le Marais and Place des Vosges." },
      ],
    },
  ],
  precios: [
    { concepto: { es: "Museo del Louvre (visitantes de fuera de la UE)", en: "The Louvre (non-EU visitors)" }, monto: { es: "€32", en: "€32" }, enlace: "https://www.louvre.fr", verificado: true },
    { concepto: { es: "Torre Eiffel: cima en ascensor / 2.º piso", en: "Eiffel Tower: summit by lift / 2nd floor" }, monto: { es: "€36,70 / €23,50", en: "€36.70 / €23.50" }, enlace: "https://www.toureiffel.paris", verificado: true },
    { concepto: { es: "Museo de Orsay", en: "Musée d'Orsay" }, monto: { es: "≈ €16", en: "≈ €16" } },
    { concepto: { es: "Palacio de Versalles (pase de un día)", en: "Palace of Versailles (day pass)" }, monto: { es: "≈ €32", en: "≈ €32" } },
    { concepto: { es: "Boleto de metro", en: "Metro ticket" }, monto: { es: "≈ €2,50", en: "≈ €2.50" } },
    { concepto: { es: "Café y croissant / menú del mediodía", en: "Coffee and croissant / lunch set menu" }, monto: { es: "€5–8 / €18–28", en: "€5–8 / €18–28" } },
    { concepto: { es: "Cama en hostel / hotel de 3 estrellas (noche)", en: "Hostel bed / 3-star hotel (night)" }, monto: { es: "€40–60 / €140–220", en: "€40–60 / €140–220" } },
  ],
  porDia: { economico: [100, 130], equilibrado: [220, 300], premium: [450, 700] },
  consejos: [
    { es: "Los museos nacionales cierran un día por semana (el Louvre, los martes; Orsay, los lunes): revisalo al armar el plan.", en: "National museums close one day a week (the Louvre on Tuesdays, Orsay on Mondays): check before you plan." },
    { es: "Subí a la Torre Eiffel a primera hora o de noche: hay menos fila.", en: "Go up the Eiffel Tower first thing or at night: queues are shorter." },
    { es: "El menú del mediodía (formule) es la forma más barata de comer bien.", en: "The lunch set menu (formule) is the cheapest way to eat well." },
  ],
};
