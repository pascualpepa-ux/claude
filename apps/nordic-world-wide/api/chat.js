/* /api/chat — chat interno del equipo (solo admin).
   GET:  últimos 200 mensajes.  POST { nombre, texto }: añade un mensaje. */
const { TEAM, isAdmin, redis, readBody, send, fail, clean } = require("./_lib");

const KEY = "nww:chat";

module.exports = async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: "UNAUTHORIZED" });
  try {
    if (req.method === "GET") {
      const [list] = await redis([["LRANGE", KEY, "-200", "-1"]]);
      return send(res, 200, {
        messages: (list || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean)
      });
    }
    if (req.method === "POST") {
      const b = readBody(req);
      const nombre = TEAM.includes(b.nombre) ? b.nombre : null;
      const texto = clean(b.texto, 1000);
      if (!nombre || !texto) return send(res, 400, { error: "BAD_REQUEST" });
      const msg = { nombre, texto, fecha: new Date().toISOString() };
      await redis([["RPUSH", KEY, JSON.stringify(msg)], ["LTRIM", KEY, "-500", "-1"]]);
      return send(res, 200, { ok: true, message: msg });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "METHOD" });
  } catch (err) {
    return fail(res, err);
  }
};
