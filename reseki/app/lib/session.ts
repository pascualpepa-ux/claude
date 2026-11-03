import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";

/**
 * Devuelve el usuario conectado y su restaurante. Si no hay sesión, manda al login.
 * La consulta pasa por RLS: aunque alguien manipule la petición, solo obtiene SU restaurante.
 */
export async function requireRestaurant() {
  // Sin Supabase configurado no puede haber sesión: al login (que muestra el aviso).
  if (!isSupabaseConfigured) redirect("/login?error=config");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single<Restaurant>();

  if (error || !restaurant) {
    // No debería ocurrir: el trigger handle_new_user crea el restaurante al registrarse.
    console.error("[session] restaurante no encontrado", error);
    throw new Error("No encontramos tu restaurante. Escríbenos y lo resolvemos.");
  }
  return { supabase, user, restaurant };
}
