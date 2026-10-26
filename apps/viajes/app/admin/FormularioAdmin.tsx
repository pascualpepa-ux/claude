"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "@/components/ProveedorIdioma";

export function FormularioAdmin() {
  const router = useRouter();
  const { t } = useIdioma();
  const A = t.admin;
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <LockSimple size={36} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{A.titulo}</h1>
      <p className="mt-1 text-arena-600 dark:text-arena-400">{A.ingresar}</p>
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
            setError(res.status === 401 ? A.incorrecta : res.status === 503 ? A.sinConfigurar : A.noSePudo);
          } catch {
            setError(A.sinInternet);
          } finally {
            setEnviando(false);
          }
        }}
      >
        <div className="grid gap-2">
          <label htmlFor="contrasena" className="text-sm font-medium">
            {A.contrasena}
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
            className={`w-full rounded-xl border bg-papel px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-oliva-600/40 dark:bg-arena-900 ${
              error ? "border-red-500 dark:border-red-400" : "border-arena-300 dark:border-arena-700"
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
          className="rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-50 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
        >
          {enviando ? A.entrando : A.entrar}
        </button>
      </form>
    </div>
  );
}
