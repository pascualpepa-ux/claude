"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/** Cliente de Supabase para componentes del navegador. Usa la clave pública (anon) + RLS. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
