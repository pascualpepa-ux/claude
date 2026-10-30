"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdioma } from "./ProveedorIdioma";

/** Login / creación de cuenta para Rumbo Premium. */
export function FormularioCuenta() {
  const router = useRouter();
  const { t } = useIdioma();
  const P = t.premium;
  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const mensajeError = (status: number, cuerpo: { error?: string }) => {
    if (status === 429) return P.errorLimite;
    if (status === 503) return P.errorSinConfigurar;
    if (modo === "registrar") {
      if (cuerpo.error === "email") return P.errorEmail;
      if (cuerpo.error === "contrasena") return P.errorContrasena;
      if (cuerpo.error === "existe") return P.errorExiste;
    } else if (status === 401) {
      return P.errorCredenciales;
    }
    return P.errorNoSePudo;
  };

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError("");
        try {
          const res = await fetch(`/api/cuenta/${modo === "entrar" ? "entrar" : "registrar"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, contrasena }),
          });
          if (res.ok) {
            router.refresh();
            return;
          }
          const cuerpo = await res.json().catch(() => ({}));
          setError(mensajeError(res.status, cuerpo));
        } catch {
          setError(P.errorSinInternet);
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="grid gap-2">
        <label htmlFor="email-cuenta" className="text-sm font-medium">
          {P.email}
        </label>
        <input
          id="email-cuenta"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-arena-300 bg-papel px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-oliva-600/40 dark:border-arena-700 dark:bg-arena-900"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="contrasena-cuenta" className="text-sm font-medium">
          {modo === "registrar" ? P.contrasenaNueva : P.contrasena}
        </label>
        <input
          id="contrasena-cuenta"
          type="password"
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "error-cuenta" : undefined}
          className={`w-full rounded-xl border bg-papel px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-oliva-600/40 dark:bg-arena-900 ${
            error ? "border-red-500 dark:border-red-400" : "border-arena-300 dark:border-arena-700"
          }`}
        />
        {error && (
          <p id="error-cuenta" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={enviando || !email || !contrasena}
        className="rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-50 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
      >
        {modo === "entrar" ? (enviando ? P.entrando : P.entrar) : enviando ? P.creando : P.crearCuenta}
      </button>
      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === "entrar" ? "registrar" : "entrar"));
          setError("");
        }}
        className="text-sm text-oliva-700 underline underline-offset-2 hover:text-oliva-800 dark:text-oliva-300 dark:hover:text-oliva-200"
      >
        {modo === "entrar" ? P.noTenesCuenta : P.yaTenesCuenta}
      </button>
    </form>
  );
}
