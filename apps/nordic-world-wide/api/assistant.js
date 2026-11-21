/* /api/assistant — asistente con IA de la web (Claude, de Anthropic).
   POST { messages: [{ role: "user"|"assistant", content: "..." }, ...] }
   → { reply: "..." }

   Necesita la variable de entorno ANTHROPIC_API_KEY en Vercel
   (se crea en https://platform.claude.com → API Keys). La clave nunca llega al navegador. */
const { Anthropic } = require("@anthropic-ai/sdk");
const { redis, readBody, send } = require("./_lib");

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-5-5";
const MAX_TURNS = 12;          // mensajes de historial que se envían
const MAX_CHARS = 1500;        // largo máximo de cada mensaje
const LIMIT_PER_HOUR = 40;     // mensajes por hora por visitante (IP)

const SYSTEM = `Eres el asistente de la web de NORDIC WORLD WIDE, una marca española de streetwear (camisetas oversized de algodón pesado, estética minimalista y nórdica, colores negro, blanco y gris con acento azul hielo). La marca es un proyecto de Pascual Pepa y Guillermo Ganteaume, dos amigos que empezaron desde cero. Trabajan por drops limitados: cuando una pieza se agota, no vuelve.

Cómo funciona la tienda:
- La colección está en la sección "Shop" de la web. Ahora mismo no hay prendas publicadas: el próximo drop sale muy pronto. Si preguntan por una prenda concreta (camisetas, sudaderas, etc.), explica que se anunciará en el próximo drop y que pueden dejar su email en el formulario de Contacto para que les avisen.
- Para comprar: en la página de la prenda se elige la talla (S, M, L o XL) y se pulsa "Comprar / Consultar". Eso abre el formulario de contacto con la prenda y la talla rellenadas; el equipo responde por email para confirmar disponibilidad, precio, pago y envío.
- Los precios todavía no están definidos ("Precio a consultar").
- Envíos a toda España. Sobre pagos, plazos, devoluciones o cambios: el equipo lo confirma por email al responder el pedido.
- Contacto: formulario de la sección "Contacto" (nombre, email, teléfono opcional, producto, mensaje e imagen opcional). No hay WhatsApp ni redes sociales por ahora.

Reglas:
- Responde en el idioma del usuario (normalmente español de España), con un tono cercano y directo, en 1 a 4 frases. Sin markdown pesado: texto plano, como mucho una lista corta.
- También puedes responder preguntas generales que no tengan que ver con la tienda (cálculos, dudas, consejos de estilo...), de forma breve.
- No inventes precios, stock, fechas de lanzamiento, descuentos ni políticas que no estén arriba. Si no lo sabes, dilo y remite al formulario de Contacto.
- No pidas datos personales en el chat: para pedidos, remite siempre al formulario.`;

// Límite de uso por IP: Redis si está conectado; si no, memoria de la instancia.
const memHits = new Map();
async function overLimit(ip) {
  const key = "nww:ai:" + ip;
  try {
    const [hits] = await redis([["INCR", key], ["EXPIRE", key, "3600", "NX"]]);
    return hits > LIMIT_PER_HOUR;
  } catch (e) {
    const now = Date.now();
    const entry = memHits.get(key);
    if (!entry || now - entry.t > 3600000) { memHits.set(key, { t: now, n: 1 }); return false; }
    entry.n += 1;
    return entry.n > LIMIT_PER_HOUR;
  }
}

// Historial seguro: solo user/assistant, alternando, empezando y acabando en user.
function cleanHistory(raw) {
  const out = [];
  for (const m of Array.isArray(raw) ? raw.slice(-MAX_TURNS) : []) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const content = String(m.content == null ? "" : m.content).trim().slice(0, MAX_CHARS);
    if (!content) continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += "\n" + content;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out.length && out[out.length - 1].role === "user" ? out : [];
}

let client = null;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "METHOD" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return send(res, 503, { error: "NOT_CONFIGURED", reply: "El asistente todavía se está configurando. Mientras tanto, escríbenos desde el formulario de Contacto y te respondemos por email." });
  }

  const messages = cleanHistory(readBody(req).messages);
  if (!messages.length) return send(res, 400, { error: "BAD_REQUEST" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (await overLimit(ip)) {
    return send(res, 429, { error: "RATE_LIMIT", reply: "Has enviado muchos mensajes seguidos. Prueba de nuevo en un rato o escríbenos desde el formulario de Contacto." });
  }

  client = client || new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },            // chat: respuestas rápidas y baratas
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",                         // si el modelo declina, prueba otro automáticamente
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages
    });

    if (response.stop_reason === "refusal") {
      return send(res, 200, { reply: "Prefiero no responder a eso. Si tienes una duda sobre NORDIC WORLD WIDE, pregúntame o escríbenos desde el formulario de Contacto." });
    }
    const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return send(res, 200, { reply: reply || "No he podido generar una respuesta. ¿Puedes repetir la pregunta?" });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic: clave inválida");
      return send(res, 503, { error: "NOT_CONFIGURED", reply: "El asistente no está disponible ahora mismo. Escríbenos desde el formulario de Contacto." });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return send(res, 503, { error: "BUSY", reply: "Estoy recibiendo muchas preguntas a la vez. Prueba de nuevo en un minuto." });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      console.error("Anthropic: sin conexión", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API", err.status, err.message);
    } else {
      console.error(err);
    }
    return send(res, 502, { error: "AI_ERROR", reply: "Ha habido un problema al responder. Prueba de nuevo o escríbenos desde el formulario de Contacto." });
  }
};
