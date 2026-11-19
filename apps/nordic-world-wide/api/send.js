/* =========================================================
   POST /api/send — envía cada formulario por email (Resend)
   a las 4 direcciones del equipo a la vez.
   Función serverless para Vercel (Node 18+, sin dependencias).

   Variables de entorno necesarias (Vercel → Settings → Environment Variables):
     RESEND_API_KEY  → API key de https://resend.com
     MAIL_FROM       → remitente con dominio verificado en Resend,
                       ej: "NORDIC WORLD WIDE <web@tudominio.com>"
   ========================================================= */

const RECIPIENTS = [
  "pascualpepa@icloud.com",
  "guillermogg24@icloud.com",
  "nachovaro89@icloud.com",
  "alejandrorivasruiz@icloud.com"
];

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const MIN_FILL_MS = 2500; // envíos más rápidos que esto se consideran bots

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (s, max) => String(s == null ? "" : s).replace(/[\r\n]+/g, " ").trim().slice(0, max);
const isEmail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "JSON inválido" }); }
  }
  body = body || {};

  // --- Antispam: honeypot + tiempo mínimo de rellenado ---
  // Se responde OK para no dar pistas al bot, pero no se envía nada.
  if (body.website) return res.status(200).json({ ok: true });
  if (typeof body.ts === "number" && Date.now() - body.ts < MIN_FILL_MS) return res.status(200).json({ ok: true });

  const nombre = clean(body.nombre, 80);
  const email = clean(body.email, 120);
  const telefono = clean(body.telefono, 30);
  const producto = clean(body.producto, 120);
  const talla = clean(body.talla, 10);
  const mensaje = String(body.mensaje || "").trim().slice(0, 3000);
  const esPedido = body.tipo === "pedido" || producto !== "";

  if (!nombre || !mensaje || !isEmail(email)) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Servidor de email no configurado" });

  const subject = esPedido ? `🛒 Pedido – ${producto || "Sin producto"}` : `✉️ Contacto – ${nombre}`;

  const rows = [
    ["Tipo", esPedido ? "Pedido" : "Contacto"],
    ["Nombre", nombre],
    ["Email", email],
    ["Teléfono", telefono || "—"],
    ["Producto", producto || "—"],
    ...(talla ? [["Talla", talla]] : [])
  ];

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;color:#0b0c0e">
    <div style="background:#0b0c0e;color:#fff;padding:18px 22px;font-weight:900;letter-spacing:2px">
      NORDIC <span style="color:#a9d6f5;font-size:11px;letter-spacing:4px">WORLD WIDE</span>
    </div>
    <h2 style="margin:22px 0 12px">${esc(subject)}</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#8a9199;width:110px;vertical-align:top">${k}</td><td style="padding:8px 0;font-weight:bold">${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="color:#8a9199;font-size:12px;margin:20px 0 6px;letter-spacing:2px">MENSAJE</p>
    <div style="white-space:pre-wrap;font-size:15px;line-height:1.5;border-left:3px solid #a9d6f5;padding-left:12px">${esc(mensaje)}</div>
    <p style="color:#8a9199;font-size:12px;margin-top:26px">Responde a este email para contestar directamente a ${esc(nombre)}.</p>
  </div>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nMensaje:\n${mensaje}`;

  const payload = {
    from: process.env.MAIL_FROM || "NORDIC WORLD WIDE <onboarding@resend.dev>",
    to: RECIPIENTS,
    reply_to: email,
    subject,
    html,
    text
  };

  // --- Imagen adjunta opcional ---
  const adj = body.adjunto;
  if (adj && typeof adj.base64 === "string" && adj.base64) {
    const bytes = Math.floor((adj.base64.length * 3) / 4);
    if (bytes > MAX_ATTACHMENT_BYTES) return res.status(413).json({ error: "La imagen es demasiado grande" });
    if (!/^image\//.test(String(adj.tipo || ""))) return res.status(400).json({ error: "Solo se admiten imágenes" });
    const filename = clean(adj.nombre, 100).replace(/[^\w.\- ]/g, "_") || "adjunto.jpg";
    payload.attachments = [{ filename, content: adj.base64 }];
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error", r.status, detail);
      return res.status(502).json({ error: "No se pudo enviar el email" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "No se pudo enviar el email" });
  }
};
