"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";

export function FormularioAdmin() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <LockSimple size={36} weight="duotone" className="text-teal-700 dark:text-teal-400" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Administración</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Ingresá la contraseña para ver las estadísticas.</p>
      <form
        className="mt-8 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          setError("");
          try {
            const res = await fetch("/api/admin/entrar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contrasena }),
            });
            if (res.ok) {
              router.refresh();
              return;
            }
            const datos = await res.json().catch(() => ({}));
            setError(datos.error ?? "No se pudo entrar. Probá de nuevo.");
          } catch {
            setError("No hay conexión. Revisá internet y probá de nuevo.");
          } finally {
            setEnviando(false);
          }
        }}
      >
        <div className="grid gap-2">
          <label htmlFor="contrasena" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="contrasena"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "error-contrasena" : undefined}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-600/40 dark:bg-zinc-900 ${
              error ? "border-red-500 dark:border-red-400" : "border-zinc-300 dark:border-zinc-700"
            }`}
          />
          {error && (
            <p id="error-contrasena" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={enviando || !contrasena}
          className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
