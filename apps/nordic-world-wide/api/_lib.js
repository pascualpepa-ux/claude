/* Utilidades compartidas por las funciones del panel admin.
   Los archivos que empiezan con "_" no son endpoints en Vercel. */
const crypto = require("crypto");

// Hash SHA-256 de la clave del admin. Para cambiar la clave sin tocar el código,
// definir la variable de entorno ADMIN_PASSWORD en Vercel.
const DEFAULT_PASS_HASH = "9c06eacb8b764b96066a3162d057467ff8788fba14df18e4195829df674f854d";

const TEAM = ["Pascual", "Nacho", "Billy", "Bruno"];

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();

function isAdmin(req) {
  const pass = String(req.headers["x-admin-pass"] || "");
  const expected = process.env.ADMIN_PASSWORD ? sha(process.env.ADMIN_PASSWORD) : Buffer.from(DEFAULT_PASS_HASH, "hex");
  return crypto.timingSafeEqual(sha(pass), expected);
}

// Base de datos: Upstash Redis (se conecta desde Vercel → Storage).
function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

class NoDbError extends Error {}

async function redis(commands) {
  const cfg = redisConfig();
  if (!cfg) throw new NoDbError("Base de datos no conectada");
  const r = await fetch(cfg.url + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error("Base de datos: error " + r.status);
  const out = await r.json();
  return out.map((x) => {
    if (x && x.error) throw new Error(x.error);
    return x && x.result;
  });
}

function readBody(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  return b && typeof b === "object" ? b : {};
}

function send(res, code, obj) {
  res.setHeader("Cache-Control", "no-store");
  res.status(code).json(obj);
}

// Respuesta común para errores (base de datos sin conectar, etc.)
function fail(res, err) {
  if (err instanceof NoDbError) return send(res, 503, { error: "NO_DB", message: err.message });
  console.error(err);
  return send(res, 500, { error: "SERVER", message: err.message });
}

const clean = (s, max) => String(s == null ? "" : s).trim().slice(0, max);

module.exports = { TEAM, isAdmin, redis, readBody, send, fail, clean };
