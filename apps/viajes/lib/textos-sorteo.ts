import type { Idioma } from "./idioma";

// Textos del sorteo, en español y en inglés.

export const SORTEO = {
  es: {
    alerta: "¡Alerta de sorteo!",
    titulo: "Ganate 3 días en Europa para 2",
    premio: "Vos y un acompañante: vuelo + hotel + planes incluidos",
    bajada: "Suscribite gratis a Rumbo Traveling y ya estás participando.",
    compartir: "Pasáselo a tus amigos y a tu familia: cada uno que se suscriba con tu link te suma una chance más.",
    participar: "Participar gratis",
    barra: "Sorteo: ganate 3 días en Europa para 2, con vuelo y hotel",
    barraBoton: "Participar",
    pasos: [
      { titulo: "Suscribite", texto: "Dejá tu email y confirmalo con el botón que te llega." },
      { titulo: "Recibí tu link", texto: "Al confirmar te damos tu link personal para compartir." },
      { titulo: "Sumá chances", texto: "Cada amigo o familiar que se suscribe con tu link es una chance más." },
    ],
    cierre: (f: string) => `El sorteo cierra el ${f}.`,
    bases: "Bases y condiciones",
    tuLink: "Tu link para sumar chances",
    tusChances: (n: number) => (n === 1 ? "Tenés 1 chance" : `Tenés ${n} chances`),
    copiar: "Copiar link",
    copiado: "¡Copiado!",
    whatsapp: "Mandar por WhatsApp",
    mensaje: (url: string) => `¡Estoy participando para ganar 3 días en Europa para 2 personas, con vuelo y hotel! Suscribite gratis con mi link y los dos sumamos: ${url}`,
    invitado: "Te invitaron al sorteo: si te suscribís, los dos suman una chance.",
  },
  en: {
    alerta: "Giveaway alert!",
    titulo: "Win 3 days in Europe for 2",
    premio: "You and a companion: flight + hotel + activities included",
    bajada: "Subscribe to Rumbo Traveling for free and you're in.",
    compartir: "Share it with friends and family: every person who subscribes with your link gives you one more chance.",
    participar: "Enter for free",
    barra: "Giveaway: win 3 days in Europe for 2, with flight and hotel",
    barraBoton: "Enter",
    pasos: [
      { titulo: "Subscribe", texto: "Leave your email and confirm it with the button we send you." },
      { titulo: "Get your link", texto: "Once you confirm, you get your personal link to share." },
      { titulo: "Add chances", texto: "Every friend or family member who subscribes with your link is one more chance." },
    ],
    cierre: (f: string) => `The giveaway closes on ${f}.`,
    bases: "Official rules",
    tuLink: "Your link to add chances",
    tusChances: (n: number) => (n === 1 ? "You have 1 chance" : `You have ${n} chances`),
    copiar: "Copy link",
    copiado: "Copied!",
    whatsapp: "Send on WhatsApp",
    mensaje: (url: string) => `I'm entering to win 3 days in Europe for 2, with flight and hotel! Subscribe for free with my link and we both get a chance: ${url}`,
    invitado: "You were invited to the giveaway: if you subscribe, you both get a chance.",
  },
} satisfies Record<Idioma, unknown>;

export const enlaceSorteo = (sitio: string, codigo: string) => `${sitio}/sorteo?ref=${encodeURIComponent(codigo)}`;
