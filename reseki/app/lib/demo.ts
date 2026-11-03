/**
 * Modo demo: reseñas de ejemplo realistas mientras Google aprueba el acceso a su API.
 * Se activa con RESEKI_DEMO_MODE=true (por defecto). Con "false" se usa Google real.
 *
 * Las primeras INITIAL_COUNT se cargan al conectar la ficha; el resto se va "recibiendo"
 * al pulsar «Buscar nuevas», para poder enseñar cómo llegan reseñas nuevas.
 */

export interface DemoReview {
  id: string;
  author: string;
  rating: number;
  language: string;
  comment: string;
  hoursAgo: number;
  /** Respuesta que el dueño ya había publicado en Google antes de Reseki ({name} = nombre del negocio). */
  ownerReply?: string;
}

export const INITIAL_COUNT = 10;

/** Catálogo de hostelería (restaurantes, bares, cafeterías). */
export const FOOD_REVIEWS: DemoReview[] = [
  { id: "demo-01", author: "Lucía Fernández", rating: 5, language: "es", hoursAgo: 2,
    comment: "Cenamos el sábado y todo de diez. El arroz meloso, espectacular, y el servicio muy atento sin agobiar. Volveremos seguro." },
  { id: "demo-02", author: "Andrés Gómez", rating: 2, language: "es", hoursAgo: 5,
    comment: "La comida rica, pero esperamos 40 minutos por la mesa aunque teníamos reserva. Nadie nos dio una explicación y eso arruinó la noche." },
  { id: "demo-03", author: "Tom Becker", rating: 4, language: "en", hoursAgo: 26,
    comment: "Great food and a lovely terrace. The paella took a while to arrive, but it was worth the wait. Friendly staff who spoke good English." },
  { id: "demo-04", author: "Jordi Puig", rating: 3, language: "ca", hoursAgo: 50,
    comment: "Bon menjar, però el preu del vi és excessiu per al que és. El personal, molt amable." },
  { id: "demo-05", author: "Valentina Ruiz", rating: 1, language: "es", hoursAgo: 75,
    comment: "Me cobraron dos veces el postre y cuando lo reclamé me pusieron mala cara. Una pena, porque el lugar es lindo." },
  { id: "demo-06", author: "Sophie Martin", rating: 5, language: "fr", hoursAgo: 98,
    comment: "Un dîner parfait. Les croquettes sont incroyables et le service très chaleureux. Merci !" },
  { id: "demo-07", author: "Carmen López", rating: 5, language: "es", hoursAgo: 140,
    comment: "Sitio precioso y la tortilla, de las mejores que he probado. Repetiremos.",
    ownerReply: "¡Qué alegría, Carmen! La tortilla es nuestra debilidad, así que nos lo apuntamos como medalla. Aquí tienes tu mesa cuando quieras. Un abrazo grande, la familia de {name}" },
  { id: "demo-08", author: "Diego Herrera", rating: 4, language: "es", hoursAgo: 210,
    comment: "Muy buena relación calidad-precio en el menú del día. El local se llena y hay bastante ruido.",
    ownerReply: "Gracias, Diego. Tienes razón con el ruido: a mediodía esto es una fiesta y lo estamos mirando. Nos alegra que el menú te convenza. Un abrazo grande, la familia de {name}" },
  { id: "demo-09", author: "Giulia Romano", rating: 4, language: "it", hoursAgo: 300,
    comment: "Cibo buonissimo e porzioni abbondanti. Il cameriere ci ha consigliato un vino ottimo. Unico difetto: un po' di attesa per il conto." },
  { id: "demo-10", author: "Mateo", rating: 5, language: "es", hoursAgo: 420, comment: "",
    ownerReply: "¡Gracias por las cinco estrellas, Mateo! Un abrazo grande, la familia de {name}" },

  // ── Llegan después, con «Buscar nuevas» ──
  { id: "demo-11", author: "Ana Beltrán", rating: 2, language: "es", hoursAgo: 0.3,
    comment: "Las croquetas llegaron frías y tuvimos que pedir que las calentaran. El camarero, muy majo eso sí." },
  { id: "demo-12", author: "James Walker", rating: 5, language: "en", hoursAgo: 0.2,
    comment: "Best meal of our trip to Spain. Ask for the house vermouth!" },
  { id: "demo-13", author: "Rafael Sousa", rating: 4, language: "pt", hoursAgo: 0.2,
    comment: "Comida excelente e ambiente acolhedor. Voltaremos na próxima viagem." },
  { id: "demo-14", author: "Paula Méndez", rating: 3, language: "es", hoursAgo: 0.1,
    comment: "El cochinillo, perfecto. Pero nos costó muchísimo que nos trajeran la cuenta y teníamos prisa." },
  { id: "demo-15", author: "Marta Iglesias", rating: 5, language: "es", hoursAgo: 0.1,
    comment: "Celebramos el cumpleaños de mi madre y nos sacaron una vela en el postre sin pedirlo. Detallazo." },
];

/** Catálogo genérico (tiendas, peluquerías, clínicas, talleres, hoteles…). */
export const GENERAL_REVIEWS: DemoReview[] = [
  { id: "gen-01", author: "Lucía Fernández", rating: 5, language: "es", hoursAgo: 2,
    comment: "Atención de diez. Me asesoraron sin prisas y me fui con exactamente lo que necesitaba. Volveré seguro." },
  { id: "gen-02", author: "Andrés Gómez", rating: 2, language: "es", hoursAgo: 5,
    comment: "Tenía cita a las 11 y me atendieron a las 11:45. Nadie me avisó del retraso ni me pidió disculpas." },
  { id: "gen-03", author: "Tom Becker", rating: 4, language: "en", hoursAgo: 26,
    comment: "Friendly staff and good quality. A bit pricey compared to other places, but the service makes up for it." },
  { id: "gen-04", author: "Jordi Puig", rating: 3, language: "ca", hoursAgo: 50,
    comment: "Bon servei, però els preus han pujat molt aquest any. El personal, molt amable." },
  { id: "gen-05", author: "Valentina Ruiz", rating: 1, language: "es", hoursAgo: 75,
    comment: "Me cobraron de más y cuando lo reclamé me trataron fatal. Una pena, porque el local es lindo." },
  { id: "gen-06", author: "Sophie Martin", rating: 5, language: "fr", hoursAgo: 98,
    comment: "Service impeccable et équipe très professionnelle. Je recommande vivement !" },
  { id: "gen-07", author: "Carmen López", rating: 5, language: "es", hoursAgo: 140,
    comment: "Llevo años viniendo y nunca falla. Trato cercano y resultado perfecto.",
    ownerReply: "¡Qué alegría, Carmen! Años juntos ya, eso no se paga con nada. Aquí estamos para lo que necesites. Un abrazo grande, la familia de {name}" },
  { id: "gen-08", author: "Diego Herrera", rating: 4, language: "es", hoursAgo: 210,
    comment: "Buena relación calidad-precio. Los sábados hay mucha gente y toca esperar.",
    ownerReply: "Gracias, Diego. Tienes razón con los sábados: es nuestro día más movido y lo estamos organizando mejor. Nos alegra que te compense. Un abrazo grande, la familia de {name}" },
  { id: "gen-09", author: "Giulia Romano", rating: 4, language: "it", hoursAgo: 300,
    comment: "Personale gentile e molto competente. Unico difetto: difficile trovare parcheggio vicino." },
  { id: "gen-10", author: "Mateo", rating: 5, language: "es", hoursAgo: 420, comment: "",
    ownerReply: "¡Gracias por las cinco estrellas, Mateo! Un abrazo grande, la familia de {name}" },
  { id: "gen-11", author: "Ana Beltrán", rating: 2, language: "es", hoursAgo: 0.3,
    comment: "Pedí un presupuesto por teléfono y en la tienda me dijeron otro precio distinto. Poco serio." },
  { id: "gen-12", author: "James Walker", rating: 5, language: "en", hoursAgo: 0.2,
    comment: "Best service we found during our trip. They even helped us in English!" },
  { id: "gen-13", author: "Rafael Sousa", rating: 4, language: "pt", hoursAgo: 0.2,
    comment: "Atendimento excelente e ambiente acolhedor. Voltarei com certeza." },
  { id: "gen-14", author: "Paula Méndez", rating: 3, language: "es", hoursAgo: 0.1,
    comment: "El resultado bien, pero el horario de atención es muy corto y es difícil venir después del trabajo." },
  { id: "gen-15", author: "Marta Iglesias", rating: 5, language: "es", hoursAgo: 0.1,
    comment: "Me ayudaron con un problema que nadie sabía resolver. Profesionales de verdad." },
];

/** Catálogo demo adecuado al tipo de negocio. */
export function demoReviewsFor(businessType: string): DemoReview[] {
  return businessType === "restaurante" || businessType === "cafeteria" ? FOOD_REVIEWS : GENERAL_REVIEWS;
}

/** Ficha de Google simulada a partir de lo que escribe el dueño en el onboarding. */
export function demoLocation(name: string, city: string) {
  return {
    google_location_name: `demo/locations/${Date.now()}`,
    google_location_title: name,
    google_location_address: city ? `${city} · ficha de ejemplo` : "Ficha de ejemplo",
  };
}

/** Reseña de ejemplo para la vista previa del tono (onboarding y configuración). */
export function sampleReviewFor(businessType: string) {
  if (businessType === "restaurante" || businessType === "cafeteria")
    return { authorName: "Pablo Martín", rating: 4, comment: "Muy buena la carne y el vino, aunque el postre tardó bastante. Volveremos." };
  return { authorName: "Pablo Martín", rating: 4, comment: "Muy buena atención y buen precio, aunque tuve que esperar bastante para que me atendieran. Volveré." };
}
