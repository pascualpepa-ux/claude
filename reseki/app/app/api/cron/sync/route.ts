import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { generateMissingReplies } from "@/lib/sync";

/**
 * Revisión periódica de reseñas (Vercel Cron, ver vercel.json).
 * Protegida con CRON_SECRET: Vercel envía "Authorization: Bearer <CRON_SECRET>".
 * En modo demo solo completa respuestas pendientes; la lectura real de Google llega en la fase 8.
 */
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: restaurants, error } = await db
    .from("restaurants")
    .select("id")
    .not("onboarding_completed_at", "is", null)
    .not("google_connected_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, number | string> = {};
  for (const r of restaurants ?? []) {
    try {
      // Fase 8: aquí se descargan primero las reseñas nuevas de Google (si !isDemoMode).
      results[r.id] = await generateMissingReplies(r.id);
    } catch (e) {
      console.error("[cron] restaurante", r.id, e);
      results[r.id] = "error";
    }
  }
  return NextResponse.json({ demo: isDemoMode, restaurants: results });
}
