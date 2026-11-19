/* /api/messages
   POST (público): guarda una copia de cada envío del formulario.
   GET  (admin):   devuelve cuántos mensajes hay y, con ?full=1, la lista. */
const { isAdmin, redis, readBody, send, fail, clean } = require("./_lib");

const KEY = "nww:messages";

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const b = readBody(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot

      const msg = {
        tipo: b.tipo === "pedido" ? "pedido" : "contacto",
        nombre: clean(b.nombre, 80),
        email: clean(b.email, 120),
        telefono: clean(b.telefono, 30),
        producto: clean(b.producto, 120),
        talla: clean(b.talla, 10),
        mensaje: clean(b.mensaje, 3000),
        adjunto: !!b.adjunto,
        fecha: new Date().toISOString()
      };
      if (!msg.nombre || !msg.mensaje || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
        return send(res, 400, { error: "BAD_REQUEST" });
      }

      // Límite antispam: 20 envíos por hora por IP
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
      const [hits] = await redis([["INCR", "nww:rl:" + ip], ["EXPIRE", "nww:rl:" + ip, "3600"]]);
      if (hits > 20) return send(res, 429, { error: "RATE_LIMIT" });

      await redis([["LPUSH", KEY, JSON.stringify(msg)], ["LTRIM", KEY, "0", "999"]]);
      return send(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      if (!isAdmin(req)) return send(res, 401, { error: "UNAUTHORIZED" });
      const full = String((req.query && req.query.full) || "") === "1";
      const cmds = [["LLEN", KEY]];
      if (full) cmds.push(["LRANGE", KEY, "0", "199"]);
      const [count, list] = await redis(cmds);
      return send(res, 200, {
        count: Number(count) || 0,
        messages: full ? (list || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean) : undefined
      });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "METHOD" });
  } catch (err) {
    return fail(res, err);
  }
};
