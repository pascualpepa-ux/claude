import { esIdioma } from "@/lib/idioma";
import { emailValido, suscribir, suscripcionesActivas } from "@/lib/suscripciones";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

// Límite simple por IP (por instancia del servidor), para que nadie use el formulario para mandar emails en masa.
const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_VENTANA = 8;
const pedidos = new Map<string, number[]>();
function permitido(ip: string) {
  const ahora = Date.now();
  const recientes = (pedidos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_POR_VENTANA) return false;
  pedidos.set(ip, [...recientes, ahora]);
  return true;
}

const pareceViaje = (p: unknown): p is TripPlan => {
  const v = p as TripPlan;
  return !!v && typeof v === "object" && !!v.input && Array.isArray(v.dias) && Array.isArray(v.vuelos) && Array.isArray(v.ruta);
};

/** POST { email, idioma, plan?, sitio } — "sitio" es un campo trampa invisible: si viene lleno, es un robot. */
export async function POST(req: Request) {
  if (!suscripcionesActivas()) return Response.json({ error: "inactivo" }, { status: 503 });
  const texto = await req.text();
  if (texto.length > 400_000) return Response.json({ error: "grande" }, { status: 413 });
  let c: { email?: unknown; idioma?: unknown; plan?: unknown; sitio?: unknown } | null = null;
  try {
    c = JSON.parse(texto);
  } catch {}
  if (!c || typeof c.email !== "string" || !emailValido(c.email.trim())) return Response.json({ error: "email" }, { status: 400 });
  if (c.sitio) return Response.json({ ok: true }); // robot: se le responde como si nada
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  if (!permitido(ip)) return Response.json({ error: "limite" }, { status: 429 });
  const idioma = esIdioma(c.idioma) ? c.idioma : "es";
  const plan = pareceViaje(c.plan) ? c.plan : null;
  try {
    const r = await suscribir(c.email, idioma, plan);
    if (r === "limite") return Response.json({ error: "limite" }, { status: 429 });
    if (r === "error") return Response.json({ error: "envio" }, { status: 502 });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("suscripción:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}
