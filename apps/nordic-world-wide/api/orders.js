/* /api/orders — compras pagadas con tarjeta, para el panel admin.
   Se leen directamente de Stripe (no necesita base de datos).
   GET (admin, cabecera x-admin-pass) → { configured, test, orders: [...] } */
const { isAdmin, send } = require("./_lib");

const SECRET = () => (process.env.STRIPE_SECRET_KEY || "").trim();
const STRIPE = process.env.STRIPE_API_BASE || "https://api.stripe.com/v1";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "METHOD" });
  }
  if (!isAdmin(req)) return send(res, 401, { error: "UNAUTHORIZED" });
  if (!SECRET()) return send(res, 200, { configured: false, orders: [] });

  try {
    const url = STRIPE + "/checkout/sessions?limit=100&status=complete&expand[]=data.line_items";
    const r = await fetch(url, { headers: { Authorization: "Bearer " + SECRET() } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Stripe", r.status, j.error && j.error.message);
      return send(res, 502, { error: "STRIPE", code: (j.error && (j.error.code || j.error.type)) || String(r.status) });
    }

    const orders = (j.data || [])
      .filter((s) => s.payment_status === "paid")
      .map((s) => {
        const ship = (s.collected_information && s.collected_information.shipping_details) || s.shipping_details || {};
        const a = ship.address || {};
        const c = s.customer_details || {};
        return {
          id: s.id,
          fecha: new Date((s.created || 0) * 1000).toISOString(),
          total: (s.amount_total || 0) / 100,
          moneda: String(s.currency || "eur").toUpperCase(),
          envio: ((s.total_details && s.total_details.amount_shipping) || 0) / 100,
          nombre: ship.name || c.name || "",
          email: c.email || "",
          telefono: c.phone || "",
          direccion: [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country].filter(Boolean).join(", "),
          items: ((s.line_items && s.line_items.data) || []).map((li) => ({ nombre: li.description, cantidad: li.quantity, importe: (li.amount_total || 0) / 100 })),
          prueba: !s.livemode
        };
      });

    return send(res, 200, { configured: true, test: SECRET().startsWith("sk_test_"), orders });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "SERVER" });
  }
};
