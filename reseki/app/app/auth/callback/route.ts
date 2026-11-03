import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino de todos los enlaces de Supabase: confirmación de email, login con Google
 * y recuperación de contraseña. Canjea el código temporal por una sesión y redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/panel";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/callback]", error);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
