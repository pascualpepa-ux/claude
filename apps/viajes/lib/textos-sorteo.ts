import type { Idioma } from "./idioma";

// Textos del sorteo, en español y en inglés.

export const SORTEO = {
  es: {
    alerta: "¡Alerta de concurso!",
    titulo: "Ganate 3 días en Copenhague, Dinamarca, para 2",
    premio: "Vos y un acompañante: vuelos de ida y vuelta + hotel",
    bajada: "Suscribite gratis a Rumbo Traveling y ya estás participando.",
    compartir: "Pasáselo a tus amigos y a tu familia: cada uno que se suscriba con tu link te suma una chance más. El ganador lo elegimos nosotros entre los suscriptores.",
    participar: "Participar gratis",
    barra: "Concurso: ganate 3 días en Copenhague, Dinamarca, para 2, con vuelos y hotel",
    barraBoton: "Participar",
    pasos: [
      { titulo: "Suscribite", texto: "Dejá tu email y confirmalo con el botón que te llega." },
      { titulo: "Recibí tu link", texto: "Al confirmar te damos tu link personal para compartir." },
      { titulo: "Sumá chances", texto: "Cada amigo o familiar que se suscribe con tu link es una chance más." },
    ],
    cierre: (f: string) => `Participás hasta el ${f}. Después anunciamos al ganador.`,
    bases: "Bases del concurso",
    tuLink: "Tu link para sumar chances",
    tusChances: (n: number) => (n === 1 ? "Tenés 1 chance" : `Tenés ${n} chances`),
    copiar: "Copiar link",
    copiado: "¡Copiado!",
    whatsapp: "Mandar por WhatsApp",
    mensaje: (url: string) => `¡Estoy participando para ganar 3 días en Copenhague, Dinamarca, para 2 personas, con vuelos y hotel! Suscribite gratis con mi link y los dos sumamos: ${url}`,
    invitado: "Te invitaron al concurso: si te suscribís, los dos suman una chance.",
  },
  en: {
    alerta: "Contest alert!",
    titulo: "Win 3 days in Copenhagen, Denmark, for 2",
    premio: "You and a companion: round-trip flights + hotel",
    bajada: "Subscribe to Rumbo Traveling for free and you're in.",
    compartir: "Share it with friends and family: every person who subscribes with your link gives you one more chance. We pick the winner among our subscribers.",
    participar: "Enter for free",
    barra: "Contest: win 3 days in Copenhagen, Denmark, for 2, with flights and hotel",
    barraBoton: "Enter",
    pasos: [
      { titulo: "Subscribe", texto: "Leave your email and confirm it with the button we send you." },
      { titulo: "Get your link", texto: "Once you confirm, you get your personal link to share." },
      { titulo: "Add chances", texto: "Every friend or family member who subscribes with your link is one more chance." },
    ],
    cierre: (f: string) => `You can enter until ${f}. Then we announce the winner.`,
    bases: "Contest rules",
    tuLink: "Your link to add chances",
    tusChances: (n: number) => (n === 1 ? "You have 1 chance" : `You have ${n} chances`),
    copiar: "Copy link",
    copiado: "Copied!",
    whatsapp: "Send on WhatsApp",
    mensaje: (url: string) => `I'm entering to win 3 days in Copenhagen, Denmark, for 2, with flights and hotel! Subscribe for free with my link and we both get a chance: ${url}`,
    invitado: "You were invited to the contest: if you subscribe, you both get a chance.",
  },
} satisfies Record<Idioma, unknown>;

export const enlaceSorteo = (sitio: string, codigo: string) => `${sitio}/concurso?ref=${encodeURIComponent(codigo)}`;
