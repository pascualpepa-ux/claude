import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Divider } from "@/components/auth/card";
import { ConfigNotice } from "@/components/auth/config-notice";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <>
      <AuthCard title="Crea tu cuenta" subtitle="30 días gratis. Cancela cuando quieras.">
        <ConfigNotice />
        <GoogleButton next="/onboarding" />
        <Divider>o con tu email</Divider>
        <SignupForm />
      </AuthCard>
      <p className="text-center text-[13px] text-fg-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-fg underline underline-offset-2">Inicia sesión</Link>
      </p>
    </>
  );
}
