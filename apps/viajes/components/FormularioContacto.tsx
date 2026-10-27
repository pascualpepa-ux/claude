"use client";

import { useId, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "./ProveedorIdioma";

/** Formulario de contacto: el mensaje le llega por email al dueño de Rumbo, que responde directo a la persona. */
export function FormularioContacto() {
  const { idioma, t } = useIdioma();
  const T = t.contacto;
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<"inicio" | "enviando" | "listo">("inicio");
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(T.errores.email);
    if (mensaje.trim().length < 5) return setError(T.errores.mensaje);
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje, idioma, sitio }),
      });
      if (res.status === 403) {
        window.location.assign("/pausa");
        return;
      }
      if (res.ok) return setEstado("listo");
      const j = await res.json().catch(() => ({}));
      setError(j.error === "limite" ? T.errores.limite : j.error === "email" ? T.errores.email : T.errores.general);
    } catch {
      setError(T.errores.general);
    }
    setEstado("inicio");
  };

  const caja = "rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900";
  const campo =
    "mt-1.5 w-full rounded-xl border border-arena-300 bg-papel px-3 py-2.5 text-base placeholder:text-arena-500 focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950";

  if (estado === "listo") {
    return (
      <div className={caja}>
        <p role="status" className="flex gap-2 text-oliva-800 dark:text-oliva-200">
          <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
          {T.gracias}
        </p>
        <button
          type="button"
          onClick={() => {
            setMensaje("");
            setEstado("inicio");
          }}
          className="mt-2 text-sm text-arena-600 underline underline-offset-2 hover:text-arena-900 dark:text-arena-400 dark:hover:text-arena-100"
        >
          {T.otro}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className={caja}>
      <label htmlFor={`${id}-nombre`} className="block text-sm font-medium">{T.nombre}</label>
      <input id={`${id}-nombre`} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoComplete="name" className={campo} />
      <label htmlFor={`${id}-email`} className="mt-4 block text-sm font-medium">{T.tuEmail}</label>
      <input
        id={`${id}-email`}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={200}
        autoComplete="email"
        aria-describedby={`${id}-email-ayuda`}
        className={campo}
      />
      <p id={`${id}-email-ayuda`} className="mt-1 text-xs text-arena-500 dark:text-arena-400">{T.tuEmailAyuda}</p>
      <label htmlFor={`${id}-mensaje`} className="mt-4 block text-sm font-medium">{T.mensaje}</label>
      <textarea
        id={`${id}-mensaje`}
        rows={5}
        maxLength={3000}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder={T.mensajeEj}
        className={`${campo} resize-y`}
      />
      <input type="text" name="sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-4 h-11 rounded-xl bg-oliva-700 px-5 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
      >
        {estado === "enviando" ? T.enviando : T.enviar}
      </button>
    </form>
  );
}
