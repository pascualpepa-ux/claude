import { dbConfigurada } from "@/lib/db";
import { vigilar } from "@/lib/vigilancia";
import { vigilante } from "@/lib/agentes-reservas";
import { duffelConfigurado } from "@/lib/duffel";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Ronda de vigilancia de los viajes suscriptos. La llaman GitHub Actions (cada 30 min) y Vercel Cron (1 vez por día).
 * Es pública a propósito: aunque alguien la llame muchas veces, corre como mucho una vez cada 25 minutos.
 * Con CRON_SECRET se puede forzar una ronda (para pruebas).
 */
async function ronda(req: Request) {
  // Sin base de datos todavía no hay suscriptores: no es un error (así la tarea programada no falla).
  if (!dbConfigurada()) return Response.json({ estado: "sin base de datos" });
  const secreto = process.env.CRON_SECRET;
  const forzar = !!secreto && req.headers.get("authorization") === `Bearer ${secreto}` && new URL(req.url).searchParams.has("forzar");
  try {
    // El vigilante de reservas corre en cada ronda: ninguna compra queda a medias.
    const reservas = duffelConfigurado() ? await vigilante().catch((e) => ({ error: String(e) })) : null;
    return Response.json({ ...(await vigilar(forzar)), reservas });
  } catch (e) {
    console.error("vigilar:", e);
    return Response.json({ estado: "error" }, { status: 500 });
  }
}

export const GET = ronda;
export const POST = ronda;
