import { dbConfigurada } from "@/lib/db";
import { COOKIE_PAUSA, SEGUNDOS_PAUSA, tieneGroserias } from "@/lib/groserias";
import { esIdioma } from "@/lib/idioma";
import { guardarOpinion } from "@/lib/opiniones";

export const runtime = "nodejs";

// Como mucho 6 opiniones por hora desde la misma conexión (por instancia del servidor).
const pedidos = new Map<string, number[]>();
function permitido(ip: string) {
  const ahora = Date.now();
  const recientes = (pedidos.get(ip) ?? []).filter((t) => ahora - t < 3600_000);
  if (recientes.length >= 6) return false;
  pedidos.set(ip, [...recientes, ahora]);
  return true;
}

/** POST { estrellas: 1-5, comentario?, pagina, idioma, sitio } ("sitio" es un campo trampa para robots). */
export async function POST(req: Request) {
  if (!dbConfigurada()) return Response.json({ error: "inactivo" }, { status: 503 });
  const c = await req.json().catch(() => null);
  const estrellas = Number(c?.estrellas);
  const comentario = typeof c?.comentario === "string" ? c.comentario.trim().slice(0, 1000) : "";
  const pagina = typeof c?.pagina === "string" && /^\/[\w\-/?=&.]{0,120}$/.test(c.pagina) ? c.pagina : "/";
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) return Response.json({ error: "estrellas" }, { status: 400 });
  if (c?.sitio) return Response.json({ ok: true });
  if (comentario && tieneGroserias(comentario)) {
    const hasta = Date.now() + SEGUNDOS_PAUSA * 1000;
    return Response.json(
      { error: "pausa" },
      { status: 403, headers: { "Set-Cookie": `${COOKIE_PAUSA}=${hasta}; Max-Age=${SEGUNDOS_PAUSA}; Path=/; HttpOnly; Secure; SameSite=Lax` } },
    );
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  if (!permitido(ip)) return Response.json({ error: "limite" }, { status: 429 });
  try {
    await guardarOpinion({ pagina, estrellas, comentario, idioma: esIdioma(c?.idioma) ? c.idioma : "es" });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("opinión:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}
