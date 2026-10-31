"use client";

import { useEffect, useRef } from "react";

/**
 * Banner de Ribera del Paraíso (Marina de Sotogrande) — alojamiento recomendado, link externo.
 * Sin ancho propio: cada página lo envuelve con el contenedor que le corresponda.
 */
export function AnuncioRibera() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay manual: en Safari/iOS, si el atributo "muted" no llega a tiempo el video
  // puede quedar pausado esperando un toque. Forzándolo acá arranca siempre solo.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  return (
    <a
      href="https://riberadelparaiso.com"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group mx-auto block max-w-2xl overflow-hidden rounded-3xl border border-arena-200 bg-papel shadow-lg shadow-black/10 transition hover:shadow-xl hover:shadow-black/15 dark:border-arena-800 dark:bg-arena-900"
    >
      <div className="relative">
        <span className="absolute top-3 left-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur">
          Anuncio
        </span>
        <video
          ref={videoRef}
          src="/anuncios/ribera-del-paraiso.mp4"
          poster="/anuncios/ribera-del-paraiso-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="block aspect-video w-full object-cover transition group-hover:scale-[1.01]"
        />
      </div>
      <div className="px-5 py-4">
        <p className="font-semibold text-arena-900 dark:text-arena-50">¿Buscás apartamento en Sotogrande?</p>
        <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
          Ribera del Paraíso: apartamentos de 2 dormitorios recién renovados, frente al puerto, con pileta y cochera incluidas.
        </p>
        <p className="mt-2 text-sm font-medium text-oliva-700 dark:text-oliva-300">riberadelparaiso.com →</p>
      </div>
    </a>
  );
}
