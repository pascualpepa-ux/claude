import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Divider } from "@/components/auth/card";
import { ConfigNotice } from "@/components/auth/config-notice";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Iniciar sesión" };

const ERRORS: Record<string, string> = {
  google: "No hemos podido conectar con Google. Vuelve a intentarlo.",
  link: "El enlace ha caducado o ya se usó. Pide uno nuevo.",
  config: "El inicio de sesión todavía no está configurado.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <AuthCard title="Inicia sesión" subtitle="Bienvenido de nuevo.">
        <ConfigNotice />
        {error && ERRORS[error] && <Alert tone="error">{ERRORS[error]}</Alert>}
        <GoogleButton next={next} />
        <Divider>o con tu email</Divider>
        <LoginForm next={next} />
      </AuthCard>
      <p className="text-center text-[13px] text-fg-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-fg underline underline-offset-2">Regístrate</Link>
      </p>
    </>
  );
}
