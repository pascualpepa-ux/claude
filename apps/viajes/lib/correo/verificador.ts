import type { Idioma } from "../idioma";
import { SITIO, TEXTOS, type Correo } from "./redactor";

// Agente 2, el verificador (antes de enviar): controla idioma y contenido.
// Si algo no está bien, el email no sale y se avisa al dueño.

const desescapar = (t: string) => t.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Frases que solo aparecen en un idioma: si aparece una del otro idioma, el email está mezclado. */
function frasesDelIdioma(idioma: Idioma): string[] {
  const t = TEXTOS[idioma];
  return [t.pie, t.baja, t.confirmacion.saludo, t.confirmacion.linea, t.aviso.verViaje, t.sinBoton];
}

export function verificarCorreo(correo: Correo, idiomaSuscriptor: Idioma): string[] {
  const problemas: string[] = [];
  const html = desescapar(correo.html);
  const todo = `${correo.asunto}\n${html}\n${correo.texto}`;

  if (correo.idioma !== idiomaSuscriptor) problemas.push(`idioma ${correo.idioma} distinto del suscriptor (${idiomaSuscriptor})`);
  if (!html.includes(`<html lang="${idiomaSuscriptor}">`)) problemas.push("el HTML no declara el idioma del suscriptor");
  const otro: Idioma = idiomaSuscriptor === "es" ? "en" : "es";
  for (const f of frasesDelIdioma(otro)) if (todo.includes(f)) problemas.push(`tiene texto en ${otro}: "${f}"`);

  for (const f of correo.esperado.frases) {
    if (!html.includes(f)) problemas.push(`falta en el HTML: "${f}"`);
    if (!correo.texto.includes(f)) problemas.push(`falta en el texto plano: "${f}"`);
  }
  for (const e of correo.esperado.enlaces) {
    if (!e.startsWith(`${SITIO()}/`)) problemas.push(`enlace fuera de la web: ${e}`);
    if (!html.includes(`href="${e}"`)) problemas.push(`falta el enlace: ${e}`);
  }
  if (!correo.asunto.trim() || correo.asunto.length > 120) problemas.push("asunto vacío o demasiado largo");
  // Restos de datos que no llegaron: nunca deberían verse en un email.
  if (/\b(undefined|NaN|null)\b|\{\{|\}\}|\[object Object\]/.test(todo)) problemas.push("tiene datos vacíos o sin completar");
  return problemas;
}
