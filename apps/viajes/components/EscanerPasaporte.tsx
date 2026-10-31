"use client";

import { useRef, useState } from "react";
import { Camera } from "@phosphor-icons/react/dist/ssr";
import { leerMrz, type DatosPasaporte } from "@/lib/pasaporte";
import type { Idioma } from "@/lib/idioma";

const T = {
  es: {
    boton: "Escanear pasaporte",
    leyendo: "Leyendo el pasaporte…",
    ayuda: "Sacale una foto a la página de la foto, con las dos líneas de abajo (las de <<<) bien enfocadas. La foto no sale de tu teléfono.",
    listo: "Listo: revisá que los datos estén bien.",
    error: "No se pudo leer. Probá con más luz y el pasaporte plano, o completalo a mano.",
  },
  en: {
    boton: "Scan passport",
    leyendo: "Reading the passport…",
    ayuda: "Take a photo of the photo page, with the two lines at the bottom (the <<< ones) in focus. The photo never leaves your phone.",
    listo: "Done: check that the details are right.",
    error: "Couldn't read it. Try with more light and the passport flat, or fill it in by hand.",
  },
};

/** Recorta (si hace falta), agranda y pasa a gris la foto, para que el lector lea mejor las letras. */
async function preparar(archivo: File, soloAbajo: boolean): Promise<HTMLCanvasElement> {
  const img = await createImageBitmap(archivo);
  const desde = soloAbajo ? Math.round(img.height * 0.6) : 0;
  const alto = img.height - desde;
  const escala = Math.min(3, 2000 / img.width);
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(img.width * escala);
  lienzo.height = Math.round(alto * escala);
  const ctx = lienzo.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.6)";
  ctx.drawImage(img, 0, desde, img.width, alto, 0, 0, lienzo.width, lienzo.height);
  img.close();
  return lienzo;
}

/** Lee el pasaporte con la cámara (todo en el dispositivo, con Tesseract) y devuelve los datos ya verificados. */
export function EscanerPasaporte({ idioma, onDatos }: { idioma: Idioma; onDatos: (d: DatosPasaporte) => void }) {
  const t = T[idioma];
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"quieto" | "leyendo" | "listo" | "error">("quieto");

  const leer = async (archivo: File) => {
    setEstado("leyendo");
    try {
      const { createWorker } = await import("tesseract.js");
      const lector = await createWorker("eng");
      await lector.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<" });
      let datos: DatosPasaporte | null = null;
      // Primero solo la parte de abajo (donde están las líneas); si no alcanza, la foto entera.
      for (const soloAbajo of [true, false]) {
        const { data } = await lector.recognize(await preparar(archivo, soloAbajo));
        datos = leerMrz(data.text);
        if (datos) break;
      }
      await lector.terminate();
      if (!datos) throw new Error("sin datos");
      onDatos(datos);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  };

  return (
    <div className="grid gap-2 sm:col-span-2">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={estado === "leyendo"}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-oliva-600/60 px-4 py-3 font-semibold text-oliva-800 transition hover:bg-oliva-50 disabled:opacity-60 dark:border-oliva-300/50 dark:text-oliva-200 dark:hover:bg-oliva-950/30"
      >
        <Camera size={22} weight="duotone" aria-hidden />
        {estado === "leyendo" ? t.leyendo : t.boton}
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) leer(f);
        }}
      />
      <p role="status" className={`text-xs ${estado === "error" ? "text-red-700 dark:text-red-400" : "text-arena-600 dark:text-arena-400"}`}>
        {estado === "listo" ? t.listo : estado === "error" ? t.error : t.ayuda}
      </p>
    </div>
  );
}
