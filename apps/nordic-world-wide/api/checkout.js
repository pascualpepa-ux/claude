/* /api/checkout — pago con tarjeta (Stripe Checkout).
   Necesita la variable de entorno STRIPE_SECRET_KEY en Vercel. Sin ella, la web no muestra el carrito.

   GET  /api/checkout                  → { active, test }  (¿están activados los pagos?)
   POST /api/checkout { items, lang }  → { url }           (crea la página de pago de Stripe)
        items: [{ id, talla, cantidad }]
   GET  /api/checkout?session_id=...   → resumen del pedido pagado (para avisar al equipo)

   Envío: 4,99 € por pedido, siempre (sin envío gratis). Solo España. */
const { findProduct } = require("./_catalog");
const { readBody, send } = require("./_lib");

// .trim(): si al pegar la clave en Vercel se coló un salto de línea o espacio, se quita.
const SECRET = () => (process.env.STRIPE_SECRET_KEY || "").trim();
const STRIPE = process.env.STRIPE_API_BASE || "https://api.stripe.com/v1";
const SITE = process.env.SITE_URL || "https://nordicworldwide.vercel.app";
const ENVIO_CENT = 499;           // 4,99 € por pedido
const MAX_UNIDADES = 20;

async function stripe(route, data) {
  const body = data ? new URLSearchParams() : undefined;
  if (data) for (const [k, v] of Object.entries(data)) if (v !== undefined && v !== null) body.append(k, String(v));
  const r = await fetch(STRIPE + route, {
    method: data ? "POST" : "GET",
    headers: Object.assign(
      { Authorization: "Bearer " + SECRET() },
      data ? { "Content-Type": "application/x-www-form-urlencoded" } : {}
    ),
    body
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error("Stripe " + r.status + ": " + ((j.error && j.error.message) || "error"));
    e.code = (j.error && (j.error.code || j.error.type)) || String(r.status);
    e.param = (j.error && j.error.param) || "";
    throw e;
  }
  return j;
}

// Valida el carrito contra el catálogo (precio, talla y cantidad).
function validItems(raw) {
  const out = [];
  let units = 0;
  for (const it of Array.isArray(raw) ? raw.slice(0, 20) : []) {
    const p = findProduct(String(it && it.id || ""));
    if (!p || typeof p.precio !== "number") continue;
    const talla = String(it.talla || "");
    if (!(p.tallas || []).includes(talla)) continue;
    const qty = Math.max(1, Math.min(10, parseInt(it.cantidad, 10) || 1));
    units += qty;
    if (units > MAX_UNIDADES) break;
    out.push({ p, talla, qty });
  }
  return out;
}

module.exports = async function handler(req, res) {
  const active = !!SECRET();
  const q = req.query || {};

  if (req.method === "GET" && !q.session_id) {
    return send(res, 200, { active, test: active && SECRET().startsWith("sk_test_") });
  }
  if (!active) return send(res, 503, { error: "NOT_CONFIGURED" });

  try {
    // Resumen de un pago terminado (la web lo usa para avisar al equipo por email)
    if (req.method === "GET") {
      const id = String(q.session_id);
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return send(res, 400, { error: "BAD_REQUEST" });
      const s = await stripe("/checkout/sessions/" + encodeURIComponent(id) + "?expand[]=line_items");
      const ship = (s.collected_information && s.collected_information.shipping_details) || s.shipping_details || {};
      const a = ship.address || {};
      return send(res, 200, {
        paid: s.payment_status === "paid",
        test: !s.livemode,
        id: s.id,
        total: (s.amount_total || 0) / 100,
        envio: ((s.total_details && s.total_details.amount_shipping) || 0) / 100,
        email: (s.customer_details && s.customer_details.email) || "",
        nombre: ship.name || (s.customer_details && s.customer_details.name) || "",
        telefono: (s.customer_details && s.customer_details.phone) || "",
        direccion: [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country].filter(Boolean).join(", "),
        items: ((s.line_items && s.line_items.data) || []).map((li) => ({ nombre: li.description, cantidad: li.quantity, importe: (li.amount_total || 0) / 100 }))
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, { error: "METHOD" });
    }

    const body = readBody(req);
    const lang = body.lang === "en" ? "en" : "es";
    const items = validItems(body.items);
    if (!items.length) return send(res, 400, { error: "EMPTY_CART" });


    const data = {
      mode: "payment",
      locale: lang,
      success_url: SITE + "/?pago=ok&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: SITE + "/?pago=cancelado#shop",
      "shipping_address_collection[allowed_countries][0]": "ES",
      "phone_number_collection[enabled]": "true",
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": ENVIO_CENT,
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "eur",
      "shipping_options[0][shipping_rate_data][display_name]": lang === "en" ? "Standard shipping (Spain)" : "Envío estándar (España)",
      "payment_intent_data[description]": "NORDIC WORLD WIDE",
      // Modo prueba (clave sk_test_): se avisa bien claro en la página de pago.
      ...(SECRET().startsWith("sk_test_") ? {
        "custom_text[submit][message]": lang === "en"
          ? "⚠️ TEST MODE — this is NOT a real payment: nothing is charged."
          : "⚠️ MODO PRUEBA — este pago NO es real: no se cobra nada."
      } : {}),
      "payment_intent_data[statement_descriptor_suffix]": "NORDIC",
      "metadata[tienda]": "nordicworldwide",
      "payment_intent_data[metadata][pedido]": items.map((i) => i.qty + "x " + i.p.id + " " + i.talla).join(", ").slice(0, 490),
      "metadata[pedido]": items.map((i) => i.qty + "x " + i.p.id + " " + i.talla).join(", ").slice(0, 490)
    };
    items.forEach((i, n) => {
      const pre = "line_items[" + n + "]";
      data[pre + "[quantity]"] = i.qty;
      data[pre + "[price_data][currency]"] = "eur";
      data[pre + "[price_data][unit_amount]"] = Math.round(i.p.precio * 100);
      data[pre + "[price_data][product_data][name]"] = (SECRET().startsWith("sk_test_") ? (lang === "en" ? "[TEST – NOT REAL] " : "[PRUEBA – NO ES REAL] ") : "") + i.p.nombre + " — " + (lang === "en" ? "Size " : "Talla ") + i.talla;
      const foto = (i.p.fotos || [])[0];
      if (foto) data[pre + "[price_data][product_data][images][0]"] = SITE + "/" + foto.replace(/^\//, "");
    });

    const session = await stripe("/checkout/sessions", data);
    return send(res, 200, { url: session.url });
  } catch (err) {
    console.error(err);
    // Nunca devolver el mensaje interno (podría contener datos sensibles); solo al log del servidor.
    return send(res, 502, { error: "STRIPE", code: err.code || "", param: err.param || "" });
  }
};
