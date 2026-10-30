import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, dispositivoValido, sesionValida } from "@/lib/admin";
import { Juegos } from "./Juegos";

export const metadata: Metadata = { title: "Juegos · Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Juegos para el dueño: solo con la sesión del admin abierta. */
export default async function PaginaJuegos() {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value)) notFound();
  if (!sesionValida(galletas.get(COOKIE_ADMIN)?.value)) redirect("/admin");
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">🎮 Juegos</h1>
        <Link href="/admin" className="rounded-xl border border-arena-300 px-4 py-2 text-sm font-medium hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800">
          ← Volver al admin
        </Link>
      </div>
      <div className="mt-6">
        <Juegos />
      </div>
    </main>
  );
}
