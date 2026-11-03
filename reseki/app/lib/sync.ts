import "server-only";
import { AIError, generateReply, type StyleExample, type ToneSettings } from "@/lib/ai";
import { businessLabel } from "@/lib/business";
import { demoReviewsFor, INITIAL_COUNT } from "@/lib/demo";
import { publishReplyToGoogle } from "@/lib/google";
import { createServiceClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";

/**
 * Sincronización: traer reseñas nuevas y preparar sus respuestas.
 * Usa la clave de servicio porque corre fuera de la sesión del usuario (cron, tareas en segundo plano).
 * Por eso SIEMPRE filtra por restaurant_id de forma explícita.
 */

export function toneSettings(r: Restaurant): ToneSettings {
  return {
    restaurantName: r.google_location_title || r.name,
    businessType: businessLabel(r.business_type),
    tone: r.tone,
    useTu: r.use_tu,
    signature: r.signature,
    extraInstructions: r.extra_instructions,
  };
}

/* ─────────────── Estilo del dueño ─────────────── */

/**
 * Ejemplos de estilo: respuestas que el dueño escribió él mismo, ya sea en Google antes de
 * usar Reseki (source = 'google') o corrigiendo a mano una sugerencia (edited_by_owner).
 * Las respuestas de la IA publicadas sin cambios NO cuentan, para no reforzar su propio estilo.
 */
export async function loadStyleExamples(restaurant: Restaurant, limit = 6): Promise<StyleExample[]> {
  if (!restaurant.learn_from_past) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("replies")
    .select("final_text, reviews!inner(rating, comment)")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "publicada")
    .or("source.eq.google,edited_by_owner.eq.true")
    .not("final_text", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[style] ejemplos", error);
    return [];
  }
  return (data ?? []).map((r) => {
    const rev = (Array.isArray(r.reviews) ? r.reviews[0] : r.reviews) as { rating: number; comment: string };
    return { rating: rev.rating, review: rev.comment, reply: r.final_text as string };
  });
}

/* ─────────────── Modo demo ─────────────── */

/** Carga las primeras reseñas de ejemplo al conectar la ficha (idempotente). */
export async function seedDemoReviews(restaurantId: string, businessType: string) {
  const db = createServiceClient();
  const now = Date.now();
  const rows = demoReviewsFor(businessType).slice(0, INITIAL_COUNT).map((d) => ({
    restaurant_id: restaurantId,
    google_review_id: d.id,
    author_name: d.author,
    rating: d.rating,
    comment: d.comment,
    language: d.language,
    reviewed_at: new Date(now - d.hoursAgo * 3600e3).toISOString(),
    is_demo: true,
  }));
  const { error } = await db.from("reviews").upsert(rows, { onConflict: "restaurant_id,google_review_id", ignoreDuplicates: true });
  if (error) throw error;

  // Algunas reseñas antiguas ya tenían respuesta del dueño en Google: se importan como publicadas.
  // Son la base del "estilo del dueño" que la IA imita.
  const { data: restaurant } = await db.from("restaurants").select("google_location_title, name").eq("id", restaurantId).single();
  const name = restaurant?.google_location_title || restaurant?.name || "la casa";
  const answered = demoReviewsFor(businessType).slice(0, INITIAL_COUNT).filter((d) => d.ownerReply);
  if (!answered.length) return;
  const { data: saved } = await db
    .from("reviews")
    .select("id, google_review_id, reviewed_at, replies(id)")
    .eq("restaurant_id", restaurantId)
    .in("google_review_id", answered.map((d) => d.id));
  const replies = (saved ?? [])
    .filter((r) => !r.replies || (Array.isArray(r.replies) && !r.replies.length))
    .map((r) => {
      const text = answered.find((d) => d.id === r.google_review_id)!.ownerReply!.replace("{name}", name);
      return {
        review_id: r.id,
        restaurant_id: restaurantId,
        suggested_text: text,
        final_text: text,
        status: "publicada",
        source: "google",
        published_at: new Date(Date.parse(r.reviewed_at) + 5 * 3600e3).toISOString(),
      };
    });
  if (replies.length) {
    const { error: repErr } = await db.from("replies").insert(replies);
    if (repErr) throw repErr;
  }
}

/** Simula la llegada de reseñas nuevas. Devuelve cuántas llegaron. */
export async function receiveDemoReviews(restaurantId: string, businessType: string, max = 2): Promise<number> {
  const db = createServiceClient();
  const { data: existing, error } = await db.from("reviews").select("google_review_id").eq("restaurant_id", restaurantId);
  if (error) throw error;
  const have = new Set((existing ?? []).map((r) => r.google_review_id));
  const next = demoReviewsFor(businessType).filter((d) => !have.has(d.id)).slice(0, max);
  if (!next.length) return 0;

  const now = Date.now();
  const { error: insErr } = await db.from("reviews").insert(
    next.map((d, i) => ({
      restaurant_id: restaurantId,
      google_review_id: d.id,
      author_name: d.author,
      rating: d.rating,
      comment: d.comment,
      language: d.language,
      reviewed_at: new Date(now - i * 60e3).toISOString(),
      is_demo: true,
    })),
  );
  if (insErr) throw insErr;
  return next.length;
}

/* ─────────────── Respuestas ─────────────── */

/** Ejecuta tareas asíncronas con un máximo de N a la vez (para no saturar la API). */
async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!);
    }),
  );
}

/**
 * Genera la respuesta de cada reseña que todavía no tiene una.
 * Si la respuesta automática está activada, publica directamente las de 4 y 5 estrellas.
 * Las de 1 a 3 estrellas quedan SIEMPRE pendientes de aprobación.
 */
export async function generateMissingReplies(restaurantId: string) {
  const db = createServiceClient();
  const { data: restaurant, error } = await db.from("restaurants").select("*").eq("id", restaurantId).single<Restaurant>();
  if (error || !restaurant) throw error ?? new Error("Negocio no encontrado");

  const { data: reviews, error: revErr } = await db
    .from("reviews")
    .select("id, google_review_id, author_name, rating, comment, language, replies(id)")
    .eq("restaurant_id", restaurantId)
    .order("reviewed_at", { ascending: false });
  if (revErr) throw revErr;

  const missing = (reviews ?? []).filter((r) => !r.replies || (Array.isArray(r.replies) && r.replies.length === 0));
  const settings = toneSettings(restaurant);
  const examples = missing.length ? await loadStyleExamples(restaurant) : [];

  await pool(missing, 3, async (review) => {
    try {
      const out = await generateReply(
        { authorName: review.author_name, rating: review.rating, comment: review.comment },
        settings,
        { examples },
      );
      const auto = restaurant.auto_publish_positive && review.rating >= 4;
      if (auto) await publishReplyToGoogle(restaurant, review.google_review_id, out.text);

      await db.from("replies").insert({
        review_id: review.id,
        restaurant_id: restaurantId,
        suggested_text: out.text,
        final_text: auto ? out.text : null,
        status: auto ? "publicada" : "pendiente",
        published_automatically: auto,
        published_at: auto ? new Date().toISOString() : null,
        ai_model: out.model,
      });
      if (!review.language) await db.from("reviews").update({ language: out.language }).eq("id", review.id);
    } catch (e) {
      // Guardamos el fallo para que el dueño lo vea y pueda reintentar o escribir la suya.
      const message = e instanceof AIError ? e.message : "No hemos podido generar la respuesta.";
      console.error("[sync] respuesta", review.id, e);
      await db.from("replies").insert({
        review_id: review.id,
        restaurant_id: restaurantId,
        suggested_text: "",
        status: "error",
        error_message: message,
      });
    }
  });

  await db.from("restaurants").update({ last_synced_at: new Date().toISOString() }).eq("id", restaurantId);
  return missing.length;
}
