import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/card";
import { NewPasswordForm } from "@/components/auth/reset-forms";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva contraseña" };
export const dynamic = "force-dynamic";

/** Se llega aquí desde el enlace del email de recuperación (ya con sesión temporal). */
export default async function NewPasswordPage() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login?error=link");
  }
  return (
    <AuthCard title="Elige una contraseña nueva">
      <NewPasswordForm />
    </AuthCard>
  );
}
