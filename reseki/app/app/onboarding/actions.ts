"use server";

/**
 * Acciones del onboarding y de la configuración del tono.
 * Las acciones que tocan datos del usuario usan su sesión (RLS); las que escriben campos
 * reservados al servidor (ficha de Google) usan la clave de servicio tras verificar la sesión.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { AIError, generateReply } from "@/lib/ai";
import { BUSINESS_TYPES, businessLabel } from "@/lib/business";
import { demoLocation, sampleReviewFor } from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { requireRestaurant } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { generateMissingReplies, loadStyleExamples, seedDemoReviews } from "@/lib/sync";

export type ActionState = { error?: string; ok?: boolean };

/* ─────────────── Paso 1: conectar la ficha ─────────────── */
export async function connectBusiness(_: ActionState, formData: FormData): Promise<ActionState> {
  const { restaurant } = await requireRestaurant();

  if (!isDemoMode) {
    // Fase 8: aquí se inicia el OAuth de Google Business Profile.
    return { error: "La conexión real con Google todavía no está disponible. Usa el modo demo." };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(2, "Escribe el nombre de tu negocio.").max(100),
      city: z.string().trim().max(80).default(""),
      business_type: z.enum(BUSINESS_TYPES.map((b) => b.value) as [string, ...string[]], { message: "Elige el tipo de negocio." }),
    })
    .safeParse({ name: formData.get("name"), city: formData.get("city") ?? "", business_type: formData.get("business_type") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const db = createServiceClient();
    const { error } = await db
      .from("restaurants")
      .update({
        name: parsed.data.name,
        business_type: parsed.data.business_type,
        ...demoLocation(parsed.data.name, parsed.data.city),
        google_connected_at: new Date().toISOString(),
        // Firma por defecto razonable; el dueño la cambia en el paso 2.
        ...(restaurant.signature ? {} : { signature: `${restaurant.owner_name.split(" ")[0] || "El equipo"}, ${parsed.data.name}` }),
      })
      .eq("id", restaurant.id);
    if (error) throw error;
    await seedDemoReviews(restaurant.id, parsed.data.business_type);
  } catch (e) {
    console.error("[onboarding] conectar", e);
    return { error: "No hemos podido conectar la ficha. Vuelve a intentarlo." };
  }
  redirect("/onboarding?paso=2");
}

/* ─────────────── Paso 2 / Configuración: tono ─────────────── */
const toneSchema = z.object({
  tone: z.enum(["cercano", "formal", "divertido"]),
  use_tu: z.enum(["true", "false"]).transform((v) => v === "true"),
  signature: z.string().trim().max(80, "La firma puede tener como mucho 80 caracteres."),
  extra_instructions: z.string().trim().max(1000, "Las indicaciones pueden tener como mucho 1000 caracteres."),
});

export async function saveTone(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, restaurant } = await requireRestaurant();
  const parsed = toneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("restaurants").update(parsed.data).eq("id", restaurant.id);
  if (error) {
    console.error("[tone] guardar", error);
    return { error: "No hemos podido guardar los cambios. Vuelve a intentarlo." };
  }
  revalidatePath("/panel", "layout");
  if (formData.get("next") === "onboarding") redirect("/onboarding?paso=3");
  return { ok: true };
}

/** Vista previa: genera una respuesta real a una reseña de ejemplo con los ajustes del formulario. */
export async function previewTone(input: {
  tone: string;
  use_tu: boolean;
  signature: string;
  extra_instructions: string;
}): Promise<{ text?: string; error?: string }> {
  const { restaurant } = await requireRestaurant();
  const parsed = toneSchema.safeParse({ ...input, use_tu: String(input.use_tu) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const out = await generateReply(sampleReviewFor(restaurant.business_type), {
      restaurantName: restaurant.google_location_title || restaurant.name,
      businessType: businessLabel(restaurant.business_type),
      tone: parsed.data.tone,
      useTu: parsed.data.use_tu,
      signature: parsed.data.signature,
      extraInstructions: parsed.data.extra_instructions,
    }, { examples: await loadStyleExamples(restaurant) });
    return { text: out.text };
  } catch (e) {
    return { error: e instanceof AIError ? e.message : "No hemos podido generar el ejemplo." };
  }
}

/* ─────────────── Paso 3: ajustes finales ─────────────── */
export async function finishOnboarding(formData: FormData) {
  const { supabase, restaurant } = await requireRestaurant();
  const { error } = await supabase
    .from("restaurants")
    .update({
      auto_publish_positive: formData.get("auto_publish_positive") === "on",
      weekly_summary_email: formData.get("weekly_summary_email") === "on",
      negative_alert_email: formData.get("negative_alert_email") === "on",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", restaurant.id);
  if (error) {
    console.error("[onboarding] terminar", error);
    redirect("/onboarding?paso=3&error=1");
  }

  // Las respuestas se generan en segundo plano: el panel se actualiza solo mientras tanto.
  after(() => generateMissingReplies(restaurant.id).catch((e) => console.error("[onboarding] generar", e)));
  redirect("/panel");
}
