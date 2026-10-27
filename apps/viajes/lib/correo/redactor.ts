import type { Idioma } from "../idioma";

// Agente 1, el redactor: arma cada email en el idioma del suscriptor.
// Usa textos fijos revisados (no IA) y solo completa los datos reales: así no puede inventar nada.

export const SITIO = () => process.env.SITIO_URL || "https://rumbotraveling.com";

export interface Correo {
  idioma: Idioma;
  asunto: string;
  html: string;
  texto: string;
  /** Lo que el verificador tiene que encontrar sí o sí en el email. */
  esperado: { frases: string[]; enlaces: string[] };
}

export const TEXTOS = {
  es: {
    confirmacion: {
      asunto: "Confirmá tu suscripción a Rumbo",
      saludo: "¡Hola, bienvenido a Rumbo!",
      linea: "Confirmá tu suscripción para recibir notificaciones de tus vuelos, hoteles y el clima de tu viaje.",
      boton: "Confirmar",
      vence: "El link vence en 48 horas. Si no pediste esto, ignorá este email.",
    },
    aviso: {
      antes: "Antes",
      ahora: "Ahora",
      verViaje: "Abrir Rumbo Traveling",
    },
    pie: "Un proyecto de Pascual Pepa",
    baja: "Darme de baja",
    sinBoton: "Si el botón no funciona, copiá este link en el navegador:",
  },
  en: {
    confirmacion: {
      asunto: "Confirm your Rumbo subscription",
      saludo: "Hi, welcome to Rumbo!",
      linea: "Confirm your subscription to get notifications about your flights, hotels and the weather for your trip.",
      boton: "Confirm",
      vence: "The link expires in 48 hours. If you didn't ask for this, just ignore this email.",
    },
    aviso: {
      antes: "Before",
      ahora: "Now",
      verViaje: "Open Rumbo Traveling",
    },
    pie: "A project by Pascual Pepa",
    baja: "Unsubscribe",
    sinBoton: "If the button doesn't work, copy this link into your browser:",
  },
} as const;

const COLOR = { oliva: "#575b40", olivaOscuro: "#3f4230", arena: "#f2ecdc", papel: "#fffdf7", texto: "#2b2a24", gris: "#6f6a5c" };

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Estructura común: logo, contenido y pie con "Un proyecto de Pascual Pepa" y el link de baja. Tablas e estilos en línea: así se ve bien en Gmail, Outlook y Apple Mail. */
function plantilla(idioma: Idioma, titulo: string, cuerpo: string, enlaceBaja: string) {
  const t = TEXTOS[idioma];
  return `<!doctype html>
<html lang="${idioma}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapar(titulo)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.arena};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.arena};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COLOR.papel};border-radius:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLOR.texto};">
<tr><td align="center" style="padding:32px 32px 8px;">
<a href="${SITIO()}" style="text-decoration:none;"><img src="${SITIO()}/marca/logo-completo-oliva.png" width="120" alt="Rumbo Traveling" style="display:block;width:120px;height:auto;border:0;"></a>
</td></tr>
${cuerpo}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center" style="padding:20px 16px;font-size:13px;line-height:20px;color:${COLOR.gris};">
${escapar(t.pie)}<br>
<a href="${escapar(enlaceBaja)}" style="color:${COLOR.gris};text-decoration:underline;">${escapar(t.baja)}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function boton(texto: string, enlace: string) {
  return `<tr><td align="center" style="padding:8px 32px 8px;">
<a href="${escapar(enlace)}" style="display:inline-block;background:${COLOR.oliva};color:#ffffff;font-size:18px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;">${escapar(texto)}</a>
</td></tr>`;
}

export const enlaceBaja = (tokenBaja: string) => `${SITIO()}/suscripcion/baja?t=${encodeURIComponent(tokenBaja)}`;

/** Email de confirmación de la suscripción. */
export function correoConfirmacion(idioma: Idioma, enlaceConfirmar: string, tokenBaja: string): Correo {
  const t = TEXTOS[idioma];
  const c = t.confirmacion;
  const baja = enlaceBaja(tokenBaja);
  const cuerpo = `<tr><td align="center" style="padding:16px 32px 0;">
<h1 style="margin:0;font-size:24px;line-height:32px;font-weight:700;color:${COLOR.olivaOscuro};">${escapar(c.saludo)}</h1>
<p style="margin:12px 0 24px;font-size:16px;line-height:24px;">${escapar(c.linea)}</p>
</td></tr>
${boton(c.boton, enlaceConfirmar)}
<tr><td align="center" style="padding:16px 32px 32px;font-size:13px;line-height:20px;color:${COLOR.gris};">
${escapar(c.vence)}<br><br>${escapar(t.sinBoton)}<br>
<a href="${escapar(enlaceConfirmar)}" style="color:${COLOR.oliva};word-break:break-all;">${escapar(enlaceConfirmar)}</a>
</td></tr>`;
  return {
    idioma,
    asunto: c.asunto,
    html: plantilla(idioma, c.asunto, cuerpo, baja),
    texto: `${c.saludo}\n\n${c.linea}\n\n${c.boton}: ${enlaceConfirmar}\n\n${c.vence}\n\n--\n${t.pie}\n${t.baja}: ${baja}`,
    esperado: { frases: [c.saludo, c.linea, c.boton, t.pie, t.baja], enlaces: [enlaceConfirmar, baja] },
  };
}

export interface CambioAviso {
  que: string; // qué cambió: "Jueves, 26 de noviembre" o "Vuelo UX 41, salida"
  antes: string;
  ahora: string;
}

export interface Aviso {
  titulo: string; // "Cambió el pronóstico en Roma"
  detalle: string; // una línea de contexto: el viaje
  cambios: CambioAviso[];
}

/** Aviso de cambios reales en el viaje: qué cambió, cómo estaba antes y cómo está ahora. */
export function correoAviso(idioma: Idioma, aviso: Aviso, tokenBaja: string): Correo {
  const t = TEXTOS[idioma];
  const a = t.aviso;
  const baja = enlaceBaja(tokenBaja);
  const enlace = `${SITIO()}/`;
  const bloque = (c: CambioAviso) => `<tr><td style="padding:0 32px 12px;">
<p style="margin:0 0 6px;font-size:14px;font-weight:600;">${escapar(c.que)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.arena};border-radius:12px;">
<tr><td style="padding:10px 14px;font-size:13px;color:${COLOR.gris};width:70px;vertical-align:top;">${escapar(a.antes)}</td><td style="padding:10px 14px;font-size:15px;color:${COLOR.gris};">${escapar(c.antes)}</td></tr>
<tr><td style="padding:10px 14px;font-size:13px;color:${COLOR.gris};width:70px;vertical-align:top;">${escapar(a.ahora)}</td><td style="padding:10px 14px;font-size:15px;font-weight:700;color:${COLOR.olivaOscuro};">${escapar(c.ahora)}</td></tr>
</table>
</td></tr>`;
  const cuerpo = `<tr><td style="padding:16px 32px 16px;">
<h1 style="margin:0;font-size:22px;line-height:30px;font-weight:700;color:${COLOR.olivaOscuro};">${escapar(aviso.titulo)}</h1>
<p style="margin:8px 0 0;font-size:15px;line-height:22px;">${escapar(aviso.detalle)}</p>
</td></tr>
${aviso.cambios.map(bloque).join("\n")}
<tr><td style="height:16px;"></td></tr>
${boton(a.verViaje, enlace)}
<tr><td style="height:24px;"></td></tr>`;
  const textoCambios = aviso.cambios.map((c) => `${c.que}\n  ${a.antes}: ${c.antes}\n  ${a.ahora}: ${c.ahora}`).join("\n\n");
  return {
    idioma,
    asunto: aviso.titulo,
    html: plantilla(idioma, aviso.titulo, cuerpo, baja),
    texto: `${aviso.titulo}\n\n${aviso.detalle}\n\n${textoCambios}\n\n${a.verViaje}: ${enlace}\n\n--\n${t.pie}\n${t.baja}: ${baja}`,
    esperado: {
      frases: [aviso.titulo, aviso.detalle, a.antes, a.ahora, t.pie, t.baja, ...aviso.cambios.flatMap((c) => [c.que, c.antes, c.ahora])],
      enlaces: [enlace, baja],
    },
  };
}
