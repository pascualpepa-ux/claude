import { dbConfigurada } from "@/lib/db";
import { vigilar } from "@/lib/vigilancia";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Ronda de vigilancia de los viajes suscriptos. La llaman GitHub Actions (cada 30 min) y Vercel Cron (1 vez por día).
 * Es pública a propósito: aunque alguien la llame muchas veces, corre como mucho una vez cada 25 minutos.
 * Con CRON_SECRET se puede forzar una ronda (para pruebas).
 */
async function ronda(req: Request) {
  if (!dbConfigurada()) return Response.json({ estado: "sin base de datos" }, { status: 503 });
  const secreto = process.env.CRON_SECRET;
  const forzar = !!secreto && req.headers.get("authorization") === `Bearer ${secreto}` && new URL(req.url).searchParams.has("forzar");
  try {
    return Response.json(await vigilar(forzar));
  } catch (e) {
    console.error("vigilar:", e);
    return Response.json({ estado: "error" }, { status: 500 });
  }
}

export const GET = ronda;
export const POST = ronda;
