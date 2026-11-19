/* /api/stats — visitas de GoatCounter de los últimos 30 días (solo admin).
   Necesita la variable de entorno GOATCOUNTER_TOKEN (GoatCounter → Settings → API). */
const { isAdmin, send } = require("./_lib");

const DAYS = 30;
const iso = (d) => d.toISOString().slice(0, 10);

module.exports = async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: "UNAUTHORIZED" });

  const token = process.env.GOATCOUNTER_TOKEN;
  if (!token) return send(res, 200, { configured: false });

  const code = process.env.GOATCOUNTER_CODE || "nordicworldwide";
  const base = process.env.GOATCOUNTER_API || `https://${code}.goatcounter.com`;
  const end = new Date();
  const start = new Date(end.getTime() - (DAYS - 1) * 86400000);

  try {
    const r = await fetch(`${base}/api/v0/stats/total?start=${iso(start)}&end=${iso(end)}`, {
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
    });
    if (!r.ok) {
      console.error("GoatCounter", r.status, await r.text());
      return send(res, 502, { error: "GOATCOUNTER", message: "GoatCounter respondió " + r.status });
    }
    const data = await r.json();

    // Una entrada por día, con 0 en los días sin visitas
    const byDay = {};
    (data.stats || []).forEach((s) => {
      const n = typeof s.daily === "number" ? s.daily : (s.hourly || []).reduce((a, b) => a + b, 0);
      byDay[s.day] = (byDay[s.day] || 0) + n;
    });
    const days = [];
    for (let i = 0; i < DAYS; i++) {
      const d = iso(new Date(start.getTime() + i * 86400000));
      days.push({ day: d, count: byDay[d] || 0 });
    }
    const total = typeof data.total === "number" ? data.total : days.reduce((a, b) => a + b.count, 0);
    return send(res, 200, { configured: true, total, days, dashboard: `https://${code}.goatcounter.com` });
  } catch (err) {
    console.error(err);
    return send(res, 502, { error: "GOATCOUNTER", message: err.message });
  }
};
