/* /api/stats — visitas de GoatCounter de los últimos 30 días (solo admin).
   Usa el contador público de GoatCounter (/counter/TOTAL.json), que no necesita token.
   Si se define GOATCOUNTER_TOKEN, usa la API completa en su lugar. */
const { isAdmin, send } = require("./_lib");

const DAYS = 30;
const DAY_MS = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const toNum = (s) => Number(String(s == null ? "0" : s).replace(/\D/g, "")) || 0;

module.exports = async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: "UNAUTHORIZED" });

  const code = process.env.GOATCOUNTER_CODE || "nordicworldwide";
  const base = process.env.GOATCOUNTER_API || `https://${code}.goatcounter.com`;
  const today = new Date(iso(new Date()) + "T00:00:00Z");
  const start = new Date(today.getTime() - (DAYS - 1) * DAY_MS);
  const dayList = Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + i * DAY_MS));

  try {
    let days;
    const token = process.env.GOATCOUNTER_TOKEN;

    if (token) {
      const r = await fetch(`${base}/api/v0/stats/total?start=${iso(start)}&end=${iso(new Date(today.getTime() + DAY_MS))}`, {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
      });
      if (!r.ok) throw new Error("GoatCounter respondió " + r.status);
      const data = await r.json();
      const byDay = {};
      (data.stats || []).forEach((s) => {
        byDay[s.day] = (byDay[s.day] || 0) + (typeof s.daily === "number" ? s.daily : (s.hourly || []).reduce((a, b) => a + b, 0));
      });
      days = dayList.map((d) => ({ day: iso(d), count: byDay[iso(d)] || 0 }));
    } else {
      // Contador público: un pedido por día ("end" no incluye ese día)
      days = await Promise.all(dayList.map(async (d) => {
        const r = await fetch(`${base}/counter/TOTAL.json?start=${iso(d)}&end=${iso(new Date(d.getTime() + DAY_MS))}`);
        if (r.status === 404) return { day: iso(d), count: 0 }; // GoatCounter devuelve 404 si no hay visitas
        if (!r.ok) throw new Error("GoatCounter respondió " + r.status);
        const j = await r.json();
        return { day: iso(d), count: toNum(j.count) };
      }));
    }

    const total = days.reduce((a, b) => a + b.count, 0);
    return send(res, 200, { configured: true, total, days, dashboard: `https://${code}.goatcounter.com`, updated: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return send(res, 502, { error: "GOATCOUNTER", message: err.message });
  }
};
