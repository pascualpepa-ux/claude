"use server";

/**
 * Acciones del panel de reseñas.
 * Patrón de seguridad: primero se lee la respuesta con la sesión del usuario (RLS garantiza
 * que es suya); solo entonces se escribe con la clave de servicio los campos reservados
 * (estado, fecha de publicación), que el navegador no puede tocar directamente.
 */

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { AIError, generateReply } from "@/lib/ai";
import { isDemoMode } from "@/lib/env";
import { publishReplyToGoogle } from "@/lib/google";
import { requireRestaurant } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { generateMissingReplies, receiveDemoReviews, toneSettings } from "@/lib/sync";

export type Result = { ok?: boolean; error?: string; message?: string };

const id = z.string().uuid();
const replyText = z.string().trim().min(2, "La respuesta está vacía.").max(4000, "La respuesta es demasiado larga (máx. 4000 caracteres).");

/** Carga una respuesta del usuario actual con su reseña. Devuelve null si no es suya. */
async function loadOwnReply(replyId: string) {
  const { supabase, restaurant } = await requireRestaurant();
  const { data } = await supabase
    .from("replies")
    .select("id, status, suggested_text, review_id, reviews(google_review_id, author_name, rating, comment)")
    .eq("id", replyId)
    .single();
  if (!data) return null;
  const review = (Array.isArray(data.reviews) ? data.reviews[0] : data.reviews) as {
    google_review_id: string; author_name: string; rating: number; comment: string;
  };
  return { reply: data, review, restaurant };
}

/* ─────────────── Aprobar y publicar ─────────────── */
export async function approveReply(replyId: string, editedText?: string): Promise<Result> {
  if (!id.safeParse(replyId).success) return { error: "Respuesta no válida." };
  const own = await loadOwnReply(replyId);
  if (!own) return { error: "No encontramos esta respuesta." };
  if (own.reply.status === "publicada") return { ok: true };

  const parsed = replyText.safeParse(editedText ?? own.reply.suggested_text);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const text = parsed.data;
  const edited = editedText !== undefined && text !== own.reply.suggested_text.trim();

  try {
    await publishReplyToGoogle(own.restaurant, own.review.google_review_id, text);
  } catch (e) {
    console.error("[panel] publicar en Google", e);
    return { error: "Google no ha aceptado la respuesta. Vuelve a intentarlo en unos minutos." };
  }

  const db = createServiceClient();
  const { error } = await db
    .from("replies")
    .update({ status: "publicada", final_text: text, edited_by_owner: edited, published_at: new Date().toISOString(), error_message: null })
    .eq("id", replyId)
    .eq("restaurant_id", own.restaurant.id);
  if (error) {
    console.error("[panel] aprobar", error);
    return { error: "Se publicó, pero no pudimos guardar el estado. Recarga la página." };
  }
  revalidatePath("/panel");
  return { ok: true, message: isDemoMode ? "Respuesta publicada (demo: no se envía a Google)" : "Respuesta publicada en Google" };
}

/* ─────────────── Rechazar ─────────────── */
export async function rejectReply(replyId: string): Promise<Result> {
  if (!id.safeParse(replyId).success) return { error: "Respuesta no válida." };
  const own = await loadOwnReply(replyId);
  if (!own) return { error: "No encontramos esta respuesta." };

  const db = createServiceClient();
  const { error } = await db
    .from("replies")
    .update({ status: "rechazada", rejected_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("restaurant_id", own.restaurant.id);
  if (error) return { error: "No hemos podido descartar la respuesta." };
  revalidatePath("/panel");
  return { ok: true };
}

/* ─────────────── Generar otra versión ─────────────── */
export async function regenerateReply(replyId: string): Promise<Result> {
  if (!id.safeParse(replyId).success) return { error: "Respuesta no válida." };
  const own = await loadOwnReply(replyId);
  if (!own) return { error: "No encontramos esta respuesta." };

  try {
    const out = await generateReply(
      { authorName: own.review.author_name, rating: own.review.rating, comment: own.review.comment },
      toneSettings(own.restaurant),
      { previousReply: own.reply.suggested_text || undefined },
    );
    const db = createServiceClient();
    const { error } = await db
      .from("replies")
      .update({ suggested_text: out.text, status: "pendiente", ai_model: out.model, error_message: null, rejected_at: null })
      .eq("id", replyId)
      .eq("restaurant_id", own.restaurant.id);
    if (error) throw error;
  } catch (e) {
    console.error("[panel] regenerar", e);
    return { error: e instanceof AIError ? e.message : "No hemos podido generar otra respuesta." };
  }
  revalidatePath("/panel");
  return { ok: true, message: "Nueva respuesta generada" };
}

/* ─────────────── Respuesta automática ─────────────── */
export async function setAutoPublish(enabled: boolean): Promise<Result> {
  const { supabase, restaurant } = await requireRestaurant();
  const { error } = await supabase.from("restaurants").update({ auto_publish_positive: enabled }).eq("id", restaurant.id);
  if (error) return { error: "No hemos podido guardar el ajuste." };

  let published = 0;
  if (enabled) {
    // Al activarla, publicamos también las de 4 y 5 estrellas que estaban esperando.
    const db = createServiceClient();
    const { data: pending } = await db
      .from("replies")
      .select("id, suggested_text, reviews!inner(google_review_id, rating)")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "pendiente")
      .gte("reviews.rating", 4);
    for (const r of pending ?? []) {
      const rev = (Array.isArray(r.reviews) ? r.reviews[0] : r.reviews) as { google_review_id: string };
      try {
        await publishReplyToGoogle(restaurant, rev.google_review_id, r.suggested_text);
        await db
          .from("replies")
          .update({ status: "publicada", final_text: r.suggested_text, published_automatically: true, published_at: new Date().toISOString() })
          .eq("id", r.id);
        published++;
      } catch (e) {
        console.error("[panel] auto-publicar", r.id, e);
      }
    }
  }
  revalidatePath("/panel");
  return {
    ok: true,
    message: enabled
      ? published ? `Respuesta automática activada · ${published} respuestas publicadas` : "Respuesta automática activada"
      : "Respuesta automática desactivada",
  };
}

/* ─────────────── Buscar reseñas nuevas ─────────────── */
export async function syncNow(): Promise<Result> {
  const { restaurant } = await requireRestaurant();
  try {
    const received = isDemoMode ? await receiveDemoReviews(restaurant.id) : 0;
    // Las respuestas se generan en segundo plano; el panel se refresca solo.
    after(() => generateMissingReplies(restaurant.id).catch((e) => console.error("[panel] sync", e)));
    revalidatePath("/panel");
    return { ok: true, message: received ? `${received} reseñas nuevas. Preparando las respuestas…` : "No hay reseñas nuevas." };
  } catch (e) {
    console.error("[panel] buscar nuevas", e);
    return { error: "No hemos podido buscar reseñas nuevas. Vuelve a intentarlo." };
  }
}

/* ─────────────── Ajustes de avisos (Configuración) ─────────────── */
export async function saveNotifications(_: Result, formData: FormData): Promise<Result> {
  const { supabase, restaurant } = await requireRestaurant();
  const { error } = await supabase
    .from("restaurants")
    .update({
      auto_publish_positive: formData.get("auto_publish_positive") === "on",
      weekly_summary_email: formData.get("weekly_summary_email") === "on",
      negative_alert_email: formData.get("negative_alert_email") === "on",
    })
    .eq("id", restaurant.id);
  if (error) return { error: "No hemos podido guardar los ajustes." };
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Ajustes guardados." };
}
