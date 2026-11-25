/* /api/assistant — asistente con IA de la web.
   POST { messages: [{ role: "user"|"assistant", content: "..." }, ...] }
   → { reply: "..." }

   Dos formas de funcionar (la clave nunca llega al navegador):
   1. GRATIS (por defecto): un modelo gratuito a través del AI Gateway de Vercel
      (https://vercel.com/docs/ai-gateway). En Vercel se autentica solo con el token
      OIDC del proyecto: no hace falta ninguna clave. Mismo sistema que Rumbo Traveling.
      ASSISTANT_FREE_MODEL cambia el modelo gratuito.
   2. Claude (Anthropic, de pago): si se define ANTHROPIC_API_KEY en Vercel, usa Claude. */
const { Anthropic } = require("@anthropic-ai/sdk");
const { getVercelOidcToken } = require("@vercel/oidc");
const { redis, readBody, send } = require("./_lib");
const { findAnswer, calc, NO_MATCH } = require("./_faq");

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-5-5";
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const FREE_MODEL = process.env.ASSISTANT_FREE_MODEL || "nvidia/nemotron-3.5-lightning-free";
const MAX_TURNS = 12;          // mensajes de historial que se envían
const MAX_CHARS = 1500;        // largo máximo de cada mensaje
const LIMIT_PER_HOUR = 40;     // mensajes por hora por visitante (IP)

const SYSTEM = `Eres el asistente de la web de NORDIC WORLD WIDE, una marca española de streetwear (camisetas oversized de algodón pesado, estética minimalista y nórdica, colores negro, blanco y gris con acento azul hielo). La marca es un proyecto de tres amigos (Pascual, Billy y Pelayo) que empezaron desde cero. Trabajan por drops limitados: cuando una pieza se agota, no vuelve.

Cómo funciona la tienda:
- La colección está en la sección "Shop" de la web. DROP 01 (todas oversized, tallas XS, S, M, L y XL):
  · NORDIC ORIGINAL (chico) — 36 €: blanca, estampado azul marino; delante logo NORDIC WORLDWIDE con estrella polar y planeta con órbita; detrás gran logo NORDIC en órbita, montañas y "Explore · Discover · Belong".
  · SUMMIT TEE (chico) — 35 €: blanca, estampado azul marino; delante logo con montañas y rosa de los vientos en la manga; detrás gran logo de montañas y "Explore more, go further".
  · MERIDIAN TEE (chico) — 35 €: blanca, estampado azul marino; delante logo con montañas y una línea horizontal en el pecho, rosa de los vientos en la manga y "Explore · Discover · Belong"; detrás gran logo de montañas atravesado por una línea vertical.
  · FJELL TEE (chico) — 36 €: blanca, estampado azul marino; delante logo NORDIC WORLDWIDE y pequeña cordillera, planeta en la manga; detrás gran logo sobre una cordillera y la estrella polar.
  · NORDSTJERNE TEE (chico) — 36 €: blanca, azul marino; delante logo con línea y estrella, gran estrella polar, franjas y planeta en las mangas; detrás gran NORDIC atravesado por una línea vertical con la estrella.
  · KOSMOS TEE (chico) — 36 €: blanca, azul marino; delante logo y estrella polar, planeta y franja en una manga, parche de montaña en la otra; detrás logo rodeado por una órbita con estrella y planeta.
  · HORISONT TEE (chico) — 35 €: blanca, azul marino; delante logo y estrella polar, franjas diagonales y planeta en las mangas; detrás logo sobre una línea de horizonte con la estrella.
  · ALPENGLOW TEE (chica) — 36 €: blanca con estampado rojo granate y azul marino; montañas, estrellas y "Explore more, go further" escrito a mano; coordenadas en la espalda.
  · NORDLYS TEE (chica) — 35 €: color crema, estampado azul marino y franjas rosas en la manga; logo NORDIC en órbita y "Explore · Discover · Belong".
  · MIDNATTSOL TEE (chica) — 35 €: crema, estampado negro y rojo granate; delante un sol rojo sobre una cordillera y líneas onduladas; detrás NORDIC en letras finas con montaña y estrella.
  Si preguntan por otras prendas (sudaderas, otros colores...), explica que llegarán en próximos drops y que pueden dejar su email en el formulario de Contacto.
- Para comprar: en la página de la prenda se elige la talla (XS, S, M, L o XL) y se pulsa "Comprar" (pago al momento) o "Añadir al carrito" (para varias). Se paga con tarjeta, Apple Pay o Google Pay en la página segura de Stripe; envío 4,99 € por pedido (solo España). Llega la confirmación por email. Para dudas antes de comprar, el formulario de Contacto.
- Envío a toda España: 4,99 € por pedido (no hay envío gratis).
- Envíos a toda España. Sobre pagos, plazos, devoluciones o cambios: el equipo lo confirma por email al responder el pedido.
- Contacto: formulario de la sección "Contacto" (nombre, email, teléfono opcional, producto, mensaje e imagen opcional). No hay WhatsApp ni redes sociales por ahora.

Reglas:
- Responde en el idioma del usuario (normalmente español de España), con un tono cercano y directo, en 1 a 4 frases. Sin markdown pesado: texto plano, como mucho una lista corta.
- Responde SOLO sobre NORDIC WORLD WIDE y la web (ropa, tallas, compras, envíos, contacto, la marca). Si preguntan otra cosa, di amablemente que solo ayudas con la tienda.
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

const REPLY_OFF = "El asistente no está disponible ahora mismo. Escríbenos desde el formulario de Contacto y te respondemos por email.";
const REPLY_BUSY = "Estoy recibiendo muchas preguntas a la vez. Prueba de nuevo en un minuto.";
const REPLY_ERROR = "Ha habido un problema al responder. Prueba de nuevo o escríbenos desde el formulario de Contacto.";
const REPLY_EMPTY = "No he podido generar una respuesta. ¿Puedes repetir la pregunta?";

// Credencial del AI Gateway: clave propia si existe; si no, el token OIDC del proyecto en Vercel.
async function gatewayToken(req) {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  const header = req.headers["x-vercel-oidc-token"];
  if (header) return String(header);
  try { return await getVercelOidcToken(); } catch (e) { return null; }
}

// Modelo gratis por el AI Gateway de Vercel (formato de chat compatible con OpenAI)
async function replyWithGateway(req, messages) {
  const token = await gatewayToken(req);
  if (!token) return { status: 503, body: { error: "NOT_CONFIGURED", reason: "no_token", reply: REPLY_OFF } };
  let r;
  try {
    r = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ model: FREE_MODEL, max_tokens: 800, messages: [{ role: "system", content: SYSTEM }].concat(messages) }),
      signal: AbortSignal.timeout(45000)
    });
  } catch (e) {
    console.error("AI Gateway: sin conexión", e.message);
    return { status: 502, body: { error: "AI_ERROR", reason: "network", reply: REPLY_ERROR } };
  }
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error("AI Gateway", r.status, detail.slice(0, 300));
    const reason = "gateway_" + r.status + (/credit card|customer_verification/i.test(detail) ? "_needs_card" : /insufficient|credits/i.test(detail) ? "_no_credits" : "");
    if (r.status === 429) return { status: 503, body: { error: "BUSY", reason, reply: REPLY_BUSY } };
    if (r.status === 401 || r.status === 403 || /credit card|customer_verification|insufficient|credits/i.test(detail)) {
      return { status: 503, body: { error: "NOT_CONFIGURED", reason, reply: REPLY_OFF } };
    }
    return { status: 502, body: { error: "AI_ERROR", reason, reply: REPLY_ERROR } };
  }
  const data = await r.json().catch(() => ({}));
  const reply = String((((data.choices || [])[0] || {}).message || {}).content || "").trim();
  return { status: 200, body: { reply: reply || REPLY_EMPTY } };
}

module.exports = async function handler(req, res) {
  // GET: la web pregunta si el asistente está activado. Siempre lo está:
  // las preguntas de la web se responden sin IA (ficha + calculadora).
  if (req.method === "GET") {
    return send(res, 200, { active: true });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "METHOD" });
  }

  const body = readBody(req);
  const lang = body.lang === "en" ? "en" : "es";
  const messages = cleanHistory(body.messages);
  if (!messages.length) return send(res, 400, { error: "BAD_REQUEST" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (await overLimit(ip)) {
    return send(res, 429, { error: "RATE_LIMIT", reply: "Has enviado muchos mensajes seguidos. Prueba de nuevo en un rato o escríbenos desde el formulario de Contacto." });
  }

  const last = messages[messages.length - 1].content;

  // 1) Cuentas ("2+2") y 2) preguntas frecuentes de la web: exactas, gratis y al instante.
  const quick = calc(last, lang) || findAnswer(last, lang);
  if (quick) return send(res, 200, { reply: quick, source: "faq" });

  // 3) Si hay IA disponible, la usa para lo que la ficha no sabe. Si no hay o falla: lista de temas.
  const ai = await replyWithAI(req, messages);
  if (ai && ai.reply) return send(res, 200, { reply: ai.reply, source: "ai" });
  return send(res, 200, { reply: NO_MATCH[lang], source: "faq", reason: ai && ai.reason });
};

// Devuelve { reply } o { reason } si no hay IA o falla (nunca lanza).
async function replyWithAI(req, messages) {
  if (!process.env.ANTHROPIC_API_KEY) {
    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL && !req.headers["x-vercel-oidc-token"]) return { reason: "no_ai" };
    const out = await replyWithGateway(req, messages);
    return out.status === 200 && out.body.reply !== REPLY_EMPTY ? { reply: out.body.reply } : { reason: out.body.reason || out.body.error };
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
    if (response.stop_reason === "refusal") return { reason: "refusal" };
    const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return reply ? { reply } : { reason: "empty" };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("Anthropic: clave inválida");
    else if (err instanceof Anthropic.RateLimitError) console.error("Anthropic: límite de uso");
    else if (err instanceof Anthropic.APIConnectionError) console.error("Anthropic: sin conexión", err.message);
    else if (err instanceof Anthropic.APIError) console.error("Anthropic API", err.status, err.message);
    else console.error(err);
    return { reason: "anthropic_error" };
  }
}
