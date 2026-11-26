import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { hayPresupuesto, registrarGasto } from "../gasto";

export const MODELO_IA = process.env.MODELO_IA || "claude-opus-5-5";

export function iaDisponible() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const SISTEMA = `Sos el motor del Creador de Juegos de Playforge, una plataforma de juegos web en español rioplatense.
Escribís juegos completos de navegador en UN SOLO archivo HTML autocontenido.

Reglas técnicas obligatorias:
- Un único documento HTML con <canvas>, CSS y JavaScript en línea. Prohibido cargar recursos externos (scripts, fuentes, imágenes, fetch, WebSocket): el juego corre en un iframe aislado sin red.
- El canvas se adapta a cualquier pantalla manteniendo la proporción (celular vertical y computadora). Nada de scroll.
- Controles con teclado (flechas/WASD/Espacio) Y táctiles (arrastrar, tocar o botones en pantalla). Si hay dos jugadores: J1 flechas, J2 WASD, y en celular cada uno usa su mitad de pantalla.
- Sonido con Web Audio API sintetizado (sin archivos), que arranca tras la primera interacción. Si se pide música, generala con osciladores.
- Pantalla de inicio, puntaje visible, récord en localStorage, pausa (tecla P/Esc y botón en pantalla), pantalla de fin con opción de volver a jugar.
- Varios niveles con dificultad progresiva. Debe poder ganarse y perderse.
- Al terminar una partida llamá a parent.postMessage({tipo:"pf-fin", gano, puntos}, "*").
- Código robusto: nada de errores en consola, sin bucles infinitos, requestAnimationFrame con delta de tiempo limitado.
- Todo el texto visible en español.

Cuando te piden un cambio sobre un juego existente, partí del HTML actual y modificá sólo lo necesario, manteniendo todo lo que ya funcionaba.

Formato de respuesta (exacto, sin nada fuera de estas etiquetas):
<explicacion>1 a 3 frases cortas contando qué hiciste o cambiaste, hablándole al usuario de vos.</explicacion>
<titulo>Nombre del juego (máx. 40 caracteres)</titulo>
<descripcion>Descripción para el catálogo (máx. 200 caracteres)</descripcion>
<html><!doctype html>...el documento completo...</html>`;

export interface RespuestaIA { explicacion: string; titulo: string; descripcion: string; html: string; costo: number }

function etiqueta(texto: string, nombre: string): string | null {
  const m = new RegExp(`<${nombre}>([\\s\\S]*?)</${nombre}>`).exec(texto);
  return m ? m[1].trim() : null;
}

export class ErrorIA extends Error {
  constructor(public motivo: "sin_clave" | "sin_presupuesto" | "rechazo" | "formato" | "api", detalle = "") { super(`${motivo} ${detalle}`.trim()); }
}

/** Pide a Claude un juego nuevo o una modificación del actual. */
export async function generarConIA(pedido: string, htmlActual: string | null, historial: { rol: "usuario" | "ia"; texto: string }[] = []): Promise<RespuestaIA> {
  if (!iaDisponible()) throw new ErrorIA("sin_clave");
  if (!(await hayPresupuesto())) throw new ErrorIA("sin_presupuesto");
  const cliente = new Anthropic();
  const contexto = historial.slice(-8).map((m) => `${m.rol === "usuario" ? "Usuario" : "Vos"}: ${m.texto}`).join("\n");
  const contenido = htmlActual
    ? `Conversación reciente:\n${contexto || "(sin mensajes previos)"}\n\nHTML actual del juego:\n<actual>\n${htmlActual}\n</actual>\n\nNuevo pedido del usuario: ${pedido}`
    : `Pedido del usuario para un juego nuevo: ${pedido}`;

  const stream = cliente.beta.messages.stream({
    model: MODELO_IA,
    max_tokens: 48000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: contenido }],
  });
  let msg;
  try {
    msg = await stream.finalMessage();
  } catch (e) {
    throw new ErrorIA("api", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : String(e));
  }
  const costo = await registrarGasto(msg.usage);
  if (msg.stop_reason === "refusal") throw new ErrorIA("rechazo");
  const texto = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const html = etiqueta(texto, "html");
  if (!html || !/<canvas|<svg|<div/i.test(html)) throw new ErrorIA("formato", texto.slice(0, 200));
  return {
    explicacion: etiqueta(texto, "explicacion") ?? "Listo, actualicé el juego.",
    titulo: (etiqueta(texto, "titulo") ?? "Mi juego").slice(0, 60),
    descripcion: (etiqueta(texto, "descripcion") ?? "").slice(0, 300),
    html: /^<!doctype/i.test(html) ? html : `<!doctype html>${html}`,
    costo,
  };
}
