/* Respuestas del asistente SIN IA: preguntas frecuentes de la web + calculadora.
   Gratis, instantáneo y sin claves. Para cambiar una respuesta, edítala aquí
   (en español "es" e inglés "en"). "k" son palabras clave, sin tildes y en minúsculas.
   Los archivos que empiezan con "_" no son endpoints en Vercel. */

const FAQ = [
  {
    id: "comprar",
    k: ["comprar", "compro", "compra", "pedido", "pedir", "encargar", "quiero", "conseguir", "buy", "order", "purchase", "get one"],
    es: "Para comprar: entra en el Shop, abre la camiseta, elige tu talla (XS, S, M, L o XL) y pulsa «Comprar» (pagas al momento) o «Añadir al carrito» para llevarte varias. Se paga con tarjeta, Apple Pay o Google Pay en la página segura de Stripe. El envío cuesta 4,99 € por pedido y te llega la confirmación por email.",
    en: "To buy: go to the Shop, open the tee, choose your size (XS, S, M, L or XL) and tap «Buy now» (pay right away) or «Add to cart» to get several. You pay by card, Apple Pay or Google Pay on Stripe's secure checkout. Shipping is €4.99 per order and you'll get a confirmation by email."
  },
  {
    id: "tallas",
    k: ["xs", "talla", "tallas", "tamano", "medida", "medidas", "queda", "fit", "oversized", "grande", "pequena", "size", "sizes", "sizing"],
    es: "Hay tallas XS, S, M, L y XL. El corte es oversized (ancho y con el hombro caído): si dudas, elige tu talla habitual; si la quieres más ajustada, una menos.",
    en: "Sizes are XS, S, M, L and XL. The fit is oversized (boxy with dropped shoulders): if unsure, take your usual size; for a closer fit, go one size down."
  },
  {
    id: "precio",
    k: ["precio", "precios", "cuesta", "cuestan", "vale", "valen", "coste", "euros", "barato", "caro", "price", "prices", "cost", "how much"],
    es: "Precios: chico — NORDIC ORIGINAL 36 €, FJELL TEE 36 €, SUMMIT TEE 35 € y MERIDIAN TEE 35 €; chica — ALPENGLOW TEE 36 €, NORDLYS TEE 35 € y MIDNATTSOL TEE 35 €. El envío cuesta 4,99 € por pedido.",
    en: "Prices: men's — NORDIC ORIGINAL €36, FJELL TEE €36, SUMMIT TEE €35 and MERIDIAN TEE €35; women's — ALPENGLOW TEE €36, NORDLYS TEE €35 and MIDNATTSOL TEE €35. Shipping is €4.99 per order."
  },
  {
    id: "envio",
    k: ["precio del envio", "coste del envio", "cuesta el envio", "gastos de envio", "how much is shipping", "shipping cost", "cost of shipping", "cuando llega", "llega mi pedido", "cuanto tarda", "cuanto tardan", "envio", "envios", "enviais", "envian", "entrega", "llega", "tarda", "plazo", "domicilio", "shipping", "ship", "delivery", "deliver", "arrive"],
    es: "Hacemos envíos a toda España. El envío cuesta 4,99 € por pedido. El plazo te lo confirmamos por email cuando hagas el pedido.",
    en: "We ship across Spain. Shipping costs €4.99 per order. We'll confirm delivery time by email when you place your order."
  },
  {
    id: "pago",
    k: ["pago", "pagar", "pagos", "tarjeta", "bizum", "transferencia", "paypal", "efectivo", "payment", "pay", "card"],
    es: "Se paga online con tarjeta (Visa, Mastercard, Amex), Apple Pay o Google Pay, en la página segura de Stripe. Nosotros nunca vemos los datos de tu tarjeta.",
    en: "You pay online by card (Visa, Mastercard, Amex), Apple Pay or Google Pay, on Stripe's secure checkout. We never see your card details."
  },
  {
    id: "devolucion",
    k: ["devolucion", "devolver", "cambio", "cambiar", "reembolso", "defecto", "return", "refund", "exchange"],
    es: "Tienes 14 días desde que recibes el pedido para devolverlo. La camiseta tiene que estar sin usar, sin lavar y con la etiqueta; el envío de vuelta lo pagas tú y te devolvemos el dinero a la misma tarjeta. Escríbenos desde Contacto para pedirlo. Todo en la página «Cambios y devoluciones» (abajo del todo en la web).",
    en: "You have 14 days from receiving your order to return it. The tee must be unworn, unwashed and with its tag; you pay the return shipping and we refund the same card. Write to us through Contact to request it. Full details on the «Returns & exchanges» page (at the bottom of the site)."
  },
  {
    id: "producto",
    k: ["camiseta", "camisetas", "producto", "productos", "prenda", "prendas", "original", "nordic original", "polaris", "summit", "meridian", "fjell", "alpenglow", "nordlys", "midnattsol", "chico", "chica", "chicos", "chicas", "hombre", "mujer", "explore", "tee", "coleccion", "catalogo", "ropa", "diseno", "estampado", "shirt", "tshirt", "collection", "product", "products", "design"],
    es: "En el DROP 01 tenemos 7 camisetas oversized. Para chico: NORDIC ORIGINAL (estrella polar y planeta, 36 €), SUMMIT TEE (montañas, 35 €), MERIDIAN TEE (líneas y montañas, 35 €) y FJELL TEE (cordillera, 36 €). Para chica: ALPENGLOW TEE (detalles rojos, 36 €), NORDLYS TEE (crema, 35 €) y MIDNATTSOL TEE (crema con sol rojo, 35 €). Tallas XS a XL. Las ves en el Shop.",
    en: "DROP 01 has 7 oversized tees. Men's: NORDIC ORIGINAL (north star and planet, €36), SUMMIT TEE (mountains, €35), MERIDIAN TEE (lines and mountains, €35) and FJELL TEE (mountain range, €36). Women's: ALPENGLOW TEE (red details, €36), NORDLYS TEE (cream, €35) and MIDNATTSOL TEE (cream with a red sun, €35). Sizes XS to XL. See them in the Shop.",
  },
  {
    id: "otras",
    k: ["sudadera", "sudaderas", "hoodie", "gorra", "gorras", "pantalon", "pantalones", "chaqueta", "colores", "color", "negra", "negro", "gris", "rosa", "verde", "azul", "cap", "hat", "jacket", "pants", "colour", "colors", "black"],
    es: "Por ahora tenemos camisetas blancas (Nordic Original, Summit, Meridian, Fjell y Alpenglow) y crema (Nordlys y Midnattsol). Sudaderas, otros colores y más prendas llegarán en próximos drops: déjanos tu email en el formulario de Contacto y te avisamos.",
    en: "For now we have white tees (Nordic Original, Summit, Meridian, Fjell and Alpenglow) and cream ones (Nordlys and Midnattsol). Hoodies, other colours and more items will come in future drops: leave your email in the Contact form and we'll let you know.",
  },
  {
    id: "drop",
    k: ["drop", "drops", "proximo", "nuevo", "nueva", "nuevos", "lanzamiento", "sale", "salen", "cuando", "limitado", "limitada", "next", "new", "release", "when", "limited"],
    es: "Trabajamos por drops limitados: cuando una pieza se agota, no vuelve. El DROP 01 ya está disponible en el Shop (7 camisetas: Nordic Original, Summit, Meridian, Fjell, Alpenglow, Nordlys y Midnattsol). Para enterarte del próximo antes que nadie, déjanos tu email en el formulario de Contacto.",
    en: "We work in limited drops: once a piece sells out, it doesn't come back. DROP 01 is out now in the Shop (7 tees: Nordic Original, Summit, Meridian, Fjell, Alpenglow, Nordlys and Midnattsol). To hear about the next one first, leave your email in the Contact form.",
  },
  {
    id: "stock",
    k: ["stock", "disponible", "disponibles", "quedan", "agotado", "agotada", "unidades", "hay", "available", "sold out", "left"],
    es: "Las unidades son limitadas: cuando una camiseta se agota, no vuelve. Si quieres asegurarte la tuya, cómprala desde su página; si tienes dudas sobre tu talla, escríbenos desde Contacto.",
    en: "Units are limited: once a tee sells out, it doesn't come back. To make sure you get yours, buy it from its page; if you're unsure about your size, write to us through Contact."
  },
  {
    id: "material",
    k: ["material", "algodon", "tela", "tejido", "calidad", "lavar", "lavado", "gramaje", "cotton", "fabric", "quality", "wash"],
    es: "Son camisetas oversized de algodón pesado. Si necesitas un dato concreto (composición, lavado…), pregúntanos por el formulario de Contacto.",
    en: "They're heavyweight cotton oversized tees. If you need a specific detail (composition, washing…), ask us through the Contact form."
  },
  {
    id: "contacto",
    k: ["contacto", "contactar", "email", "correo", "mail", "telefono", "llamar", "whatsapp", "instagram", "tiktok", "redes", "hablar", "escribir", "contact", "phone", "socials", "talk"],
    es: "Escríbenos desde el formulario de la sección Contacto (nombre, email, mensaje y, si quieres, una imagen). Te respondemos por email en menos de 24 h. Por ahora no tenemos WhatsApp ni redes sociales.",
    en: "Write to us through the form in the Contact section (name, email, message and an optional image). We reply by email within 24 hours. We don't have WhatsApp or social media yet."
  },
  {
    id: "nosotros",
    k: ["nordic world wide", "que es nordic", "que vendeis", "what is nordic", "what do you sell", "quienes sois", "quien sois", "quienes son", "quien esta detras", "quien hay detras", "sobre vosotros", "nosotros", "vuestra marca", "la marca", "duenos", "fundadores", "historia", "who are you", "about you", "about us", "your brand", "founders", "your company"],
    es: "NORDIC WORLD WIDE es un proyecto de tres amigos (Pascual, Billy y Pelayo) que empezaron desde cero. Hacemos streetwear oversized de estética nórdica, en drops limitados.",
    en: "NORDIC WORLD WIDE is a project by three friends (Pascual, Billy and Pelayo) starting from scratch. We make Nordic-inspired oversized streetwear in limited drops."
  },
  {
    id: "idioma",
    k: ["ingles", "espanol", "idioma", "english", "spanish", "language"],
    es: "La web está en español e inglés: cámbialo con el botón ES / EN de arriba.",
    en: "The site is in Spanish and English: switch with the ES / EN button at the top."
  },
  {
    id: "hola",
    k: ["hola", "buenas", "buenos", "hey", "ey", "saludos", "hello", "hi", "good morning"],
    es: "¡Hola! Te ayudo con la tienda: cómo comprar, tallas, precios, envíos, el próximo drop o cómo contactarnos. ¿Qué necesitas?",
    en: "Hi! I can help with the shop: how to buy, sizes, prices, shipping, the next drop or how to contact us. What do you need?"
  },
  {
    id: "gracias",
    k: ["gracias", "genial", "perfecto", "vale", "ok", "thanks", "thank", "great", "perfect"],
    es: "¡De nada! Si necesitas algo más, aquí estoy.",
    en: "You're welcome! If you need anything else, I'm here."
  }
];

const NO_MATCH = {
  es: "Solo puedo ayudarte con cosas de la web. Prueba a preguntarme por:\n• Cómo comprar\n• Tallas\n• Precios\n• Envíos\n• El próximo drop\n• Cómo contactarnos\nPara cualquier otra cosa, escríbenos desde el formulario de Contacto.",
  en: "I can only help with things about the site. Try asking me about:\n• How to buy\n• Sizes\n• Prices\n• Shipping\n• The next drop\n• How to contact us\nFor anything else, write to us through the Contact form."
};

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,;:()"'«»]/g, " ").replace(/\s+/g, " ").trim();

// Busca la entrada con más palabras clave en la pregunta. "hola"/"gracias" solo ganan si no hay otro tema.
function findAnswer(text, lang) {
  const q = " " + norm(text) + " ";
  let best = null, bestScore = 0;
  for (const e of FAQ) {
    let score = 0;
    for (const k of e.k) if (q.includes(" " + k + " ")) score += k.includes(" ") ? 2 : 1;
    if (e.id === "hola" || e.id === "gracias") score *= 0.5;
    if (score > bestScore) { best = e; bestScore = score; }
  }
  return best ? best[lang === "en" ? "en" : "es"] : null;
}

/* ---------- Calculadora: "2+2", "cuánto es 15 x 3", "what is (4+6)/2" ---------- */
function calc(text, lang) {
  let s = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!=]/g, " ").trim()
    .replace(/^(cuanto|cuantos|que|what|whats|how much)( es| son| is| are)?\s*/, "")
    .replace(/\b(mas)\b/g, "+").replace(/\b(menos)\b/g, "-").replace(/\b(por|x|times)\b/g, "*")
    .replace(/\b(entre|dividido|divided by)\b/g, "/").replace(/\b(plus)\b/g, "+").replace(/\b(minus)\b/g, "-")
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/(\d),(\d)/g, "$1.$2").replace(/\s+/g, "");
  if (!/^[\d.+\-*/()]+$/.test(s) || !/\d[+\-*/]/.test(s) || s.length > 60) return null;
  let i = 0;
  const peek = () => s[i];
  function num() {
    if (peek() === "(") { i++; const v = expr(); if (peek() !== ")") throw 0; i++; return v; }
    if (peek() === "-") { i++; return -num(); }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]);
  }
  function term() { let v = num(); while (peek() === "*" || peek() === "/") { const op = s[i++]; const r = num(); v = op === "*" ? v * r : v / r; } return v; }
  function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = term(); v = op === "+" ? v + r : v - r; } return v; }
  try {
    const v = expr();
    if (i !== s.length || !isFinite(v)) return null;
    const out = Math.round(v * 1e6) / 1e6;
    const pretty = s.replace(/\*/g, " × ").replace(/\//g, " ÷ ").replace(/\+/g, " + ").replace(/(\d|\))-/g, "$1 − ");
    return pretty + " = " + String(out).replace(".", lang === "en" ? "." : ",");
  } catch (e) { return null; }
}

module.exports = { findAnswer, calc, NO_MATCH };
