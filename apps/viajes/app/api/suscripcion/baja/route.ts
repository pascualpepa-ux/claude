import { darDeBaja } from "@/lib/suscripciones";

export const runtime = "nodejs";

/**
 * Baja. Sirve para el botón de la página de baja ({ t }) y para la "baja en un clic" de Gmail y Apple Mail,
 * que mandan un POST a la URL del encabezado List-Unsubscribe (con ?t=...).
 */
export async function POST(req: Request) {
  const enUrl = new URL(req.url).searchParams.get("t");
  const cuerpo = enUrl ? null : await req.json().catch(() => null);
  const t = enUrl ?? cuerpo?.t;
  if (typeof t !== "string" || t.length > 100) return Response.json({ ok: false }, { status: 400 });
  try {
    return Response.json({ ok: await darDeBaja(t) });
  } catch (e) {
    console.error("baja:", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
