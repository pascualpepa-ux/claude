import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Actúa en nombre del usuario conectado, así que la seguridad por filas (RLS) se aplica siempre.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies.
          // No pasa nada: el middleware ya refresca la sesión en cada petición.
        }
      },
    },
  });
}

/**
 * Cliente con la clave de servicio. SALTA la RLS: usar solo en el servidor y solo para
 * tareas que no actúan en nombre de un usuario (cron, webhooks de Stripe, tokens de Google).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createAdminClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
