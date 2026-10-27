"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "./ProveedorIdioma";

/** Calificación de 1 a 5 estrellas con comentario opcional. Anónima; se guarda para el admin. */
export function Calificacion({ pagina, titulo, bajada }: { pagina: string; titulo?: string; bajada?: string }) {
  const { idioma, t } = useIdioma();
  const T = t.opinion;
  const id = useId();
  const claveLocal = `rumbo:opinion:${pagina}`;
  const [estrellas, setEstrellas] = useState(0);
  const [sobre, setSobre] = useState(0);
  const [comentario, setComentario] = useState("");
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<"inicio" | "enviando" | "listo" | "ya">("inicio");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(claveLocal)) setEstado("ya");
    } catch {}
  }, [claveLocal]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estrellas) return setError(T.faltanEstrellas);
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetch("/api/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estrellas, comentario, pagina, idioma, sitio }),
      });
      if (res.status === 403) {
        window.location.assign("/pausa"); // malas palabras: un minuto de pausa, como en el chat
        return;
      }
      if (res.ok) {
        try {
          localStorage.setItem(claveLocal, String(Date.now()));
        } catch {}
        return setEstado("listo");
      }
      const j = await res.json().catch(() => ({}));
      setError(j.error === "limite" ? T.errores.limite : j.error === "inactivo" ? T.errores.inactivo : T.errores.general);
    } catch {
      setError(T.errores.general);
    }
    setEstado("inicio");
  };

  const caja = "rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900";

  if (estado === "listo" || estado === "ya") {
    return (
      <div className={caja}>
        <p role="status" className="flex gap-2 text-oliva-800 dark:text-oliva-200">
          <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
          {estado === "listo" ? T.gracias : T.yaOpinaste}
        </p>
        {estado === "ya" && (
          <button type="button" onClick={() => setEstado("inicio")} className="mt-2 text-sm text-arena-600 underline underline-offset-2 hover:text-arena-900 dark:text-arena-400 dark:hover:text-arena-100">
            {T.otra}
          </button>
        )}
      </div>
    );
  }

  const mostrada = sobre || estrellas;
  return (
    <form onSubmit={enviar} noValidate className={caja}>
      <h2 className="text-lg font-semibold">{titulo ?? T.titulo}</h2>
      {bajada && <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">{bajada}</p>}
      <div role="radiogroup" aria-label={T.estrellas} className="mt-3 flex items-center gap-1" onMouseLeave={() => setSobre(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={`${T.estrella(n)}: ${T.etiquetas[n - 1]}`}
            onClick={() => {
              setEstrellas(n);
              setError(null);
            }}
            onMouseEnter={() => setSobre(n)}
            className="grid size-11 place-items-center rounded-xl transition hover:bg-arena-100 active:scale-95 dark:hover:bg-arena-800"
          >
            <Star size={30} weight={n <= mostrada ? "fill" : "regular"} className={n <= mostrada ? "text-amber-500" : "text-arena-400"} aria-hidden />
          </button>
        ))}
        <span className="ml-2 text-sm text-arena-600 dark:text-arena-400" aria-live="polite">
          {mostrada ? T.etiquetas[mostrada - 1] : ""}
        </span>
      </div>
      <label htmlFor={`${id}-comentario`} className="mt-4 block text-sm font-medium">
        {T.comentario}
      </label>
      <textarea
        id={`${id}-comentario`}
        rows={3}
        maxLength={1000}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder={T.comentarioEj}
        className="mt-1.5 w-full resize-y rounded-xl border border-arena-300 bg-papel px-3 py-2.5 text-base placeholder:text-arena-500 focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950"
      />
      <input type="text" name="sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-3 h-11 rounded-xl bg-oliva-700 px-5 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
      >
        {estado === "enviando" ? T.enviando : T.enviar}
      </button>
    </form>
  );
}
