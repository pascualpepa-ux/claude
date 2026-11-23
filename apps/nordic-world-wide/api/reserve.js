/* /api/reserve — reservas limitadas por camiseta (máximo window.MAX_RESERVAS en js/products.js).
   Total de una camiseta = "reservadas" del catálogo (las hechas fuera de la web) + las hechas en la web.
   Las de la web se guardan en la base de datos (Upstash Redis, Vercel → Storage). Sin base de datos,
   la web muestra solo las del catálogo y avisa al equipo para actualizarlas a mano.

   GET  /api/reserve          → { max, persisted, counts: { id: total } }
   POST /api/reserve { id }   → { ok, total, left, persisted }  |  409 { error: "FULL" } */
const { loadProducts, findProduct, maxReservas } = require("./_catalog");
const { redis, readBody, send } = require("./_lib");

const KEY = (id) => "nww:reservas:" + id;

module.exports = async function handler(req, res) {
  const max = maxReservas();
  try {
    if (req.method === "GET") {
      const products = loadProducts();
      let web = products.map(() => 0), persisted = true;
      try {
        const vals = await redis(products.map((p) => ["GET", KEY(p.id)]));
        web = vals.map((v) => parseInt(v, 10) || 0);
      } catch (e) { persisted = false; }
      const counts = {};
      products.forEach((p, i) => { counts[p.id] = Math.min(max, (p.reservadas || 0) + web[i]); });
      res.setHeader("Cache-Control", "no-store");
      return send(res, 200, { max, persisted, counts });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, { error: "METHOD" });
    }

    const p = findProduct(String(readBody(req).id || ""));
    if (!p) return send(res, 400, { error: "BAD_REQUEST" });
    const base = p.reservadas || 0;
    if (base >= max) return send(res, 409, { error: "FULL", total: max, left: 0 });

    let n;
    try {
      [n] = await redis([["INCR", KEY(p.id)]]);
    } catch (e) {
      // Sin base de datos: no se puede contar; la reserva se envía igual y el equipo actualiza el catálogo.
      return send(res, 200, { ok: true, persisted: false, total: base + 1, left: Math.max(0, max - base - 1) });
    }
    if (base + n > max) {
      await redis([["DECR", KEY(p.id)]]).catch(() => {});
      return send(res, 409, { error: "FULL", total: max, left: 0 });
    }
    return send(res, 200, { ok: true, persisted: true, total: base + n, left: max - base - n });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "SERVER" });
  }
};
