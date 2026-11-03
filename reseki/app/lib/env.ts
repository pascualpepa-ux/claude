/**
 * Lectura centralizada de variables de entorno.
 * Las claves secretas solo se leen en el servidor; las NEXT_PUBLIC_* también llegan al navegador.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true cuando el proyecto de Supabase está configurado. Sin esto el login no puede funcionar. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Modo demo: reseñas de ejemplo en vez de Google real. Por defecto activado. */
export const isDemoMode = (process.env.RESEKI_DEMO_MODE ?? "true") !== "false";

/** URL pública de la app, usada para construir los enlaces de los emails de Supabase. */
export function siteUrl(fallbackOrigin?: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // En Vercel, VERCEL_URL apunta al despliegue actual (sin protocolo).
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return fallbackOrigin ?? "http://localhost:3000";
}
