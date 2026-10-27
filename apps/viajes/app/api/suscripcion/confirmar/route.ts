import { confirmar } from "@/lib/suscripciones";

export const runtime = "nodejs";

/** POST { t } — lo llama la página de confirmación al abrirse desde el botón del email. */
export async function POST(req: Request) {
  const c = await req.json().catch(() => null);
  if (typeof c?.t !== "string" || c.t.length > 100) return Response.json({ estado: "invalido" }, { status: 400 });
  try {
    return Response.json(await confirmar(c.t));
  } catch (e) {
    console.error("confirmación:", e);
    return Response.json({ estado: "error" }, { status: 500 });
  }
}
