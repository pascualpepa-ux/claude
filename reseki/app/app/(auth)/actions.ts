"use server";

/**
 * Acciones de servidor de autenticación (registro, login, Google, recuperar contraseña, salir).
 * Todas devuelven mensajes en español listos para mostrar en el formulario.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string; fields?: Record<string, string> };

const NOT_CONFIGURED = "El inicio de sesión todavía no está configurado: faltan las claves de Supabase.";

/** Traduce los códigos de error de Supabase a mensajes claros. */
function translate(error: { code?: string; message: string; status?: number }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirma tu email antes de entrar. Revisa tu bandeja de entrada (y la carpeta de spam).";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese email. Inicia sesión.";
    case "weak_password":
      return "La contraseña es demasiado débil. Usa al menos 8 caracteres combinando letras y números.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
    case "same_password":
      return "La nueva contraseña tiene que ser distinta de la anterior.";
  }
  if (error.status === 429) return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  console.error("[auth]", error);
  return "No hemos podido completar la acción. Vuelve a intentarlo en unos segundos.";
}

/** Solo permitimos redirecciones internas (evita redirecciones abiertas a otros dominios). */
function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function origin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return siteUrl(host ? `${proto}://${host}` : undefined);
}

const emailSchema = z.string().trim().toLowerCase().email("Escribe un email válido.");
const passwordSchema = z.string().min(8, "La contraseña necesita al menos 8 caracteres.");

/* ─────────────── Iniciar sesión ─────────────── */
export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, "Escribe tu contraseña.") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const fields = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translate(error), fields };

  redirect(safeNext(formData.get("next"), "/panel"));
}

/* ─────────────── Crear cuenta ─────────────── */
export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
      email: emailSchema,
      password: passwordSchema,
      terms: z.literal("on", { message: "Tienes que aceptar los Términos y la Política de privacidad." }),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      terms: formData.get("terms"),
    });
  const fields = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // El nombre se guarda en el perfil y el trigger de la base de datos lo copia al restaurante.
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: translate(error), fields };

  // Si Supabase no exige confirmar el email, ya hay sesión: directo al onboarding.
  if (data.session) redirect("/onboarding");

  return {
    message: `Te hemos enviado un email a ${parsed.data.email}. Abre el enlace para confirmar tu cuenta y empezar.`,
  };
}

/* ─────────────── Continuar con Google ─────────────── */
export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=config");
  const next = safeNext(formData.get("next"), "/panel");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    console.error("[auth] google", error);
    redirect("/login?error=google");
  }
  redirect(data.url);
}

/* ─────────────── Recuperar contraseña ─────────────── */
export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await origin()}/auth/callback?next=/nueva-contrasena`,
  });
  // Por seguridad no revelamos si el email existe: mismo mensaje en ambos casos.
  if (error && error.status === 429) return { error: translate(error) };
  return { message: `Si hay una cuenta con ${parsed.data}, te llegará un email con un enlace para elegir una contraseña nueva.` };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: translate(error) };
  redirect("/panel");
}

/* ─────────────── Cerrar sesión ─────────────── */
export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
