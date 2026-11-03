import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/card";
import { RequestResetForm } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPage() {
  return (
    <>
      <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para elegir una nueva.">
        <RequestResetForm />
      </AuthCard>
      <p className="text-center text-[13px] text-fg-muted">
        <Link href="/login" className="font-medium text-fg underline underline-offset-2">Volver a iniciar sesión</Link>
      </p>
    </>
  );
}
