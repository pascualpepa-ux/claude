"use client";

import { useEffect, useState } from "react";
import { Hourglass } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "@/components/ProveedorIdioma";
import { SEGUNDOS_PAUSA } from "@/lib/groserias";

const RADIO = 54;
const CIRCULO = 2 * Math.PI * RADIO;

export function CuentaRegresiva({ segundos }: { segundos: number }) {
  const { t } = useIdioma();
  const T = t.pausa;
  const [quedan, setQuedan] = useState(segundos);

  useEffect(() => {
    const fin = Date.now() + segundos * 1000;
    const timer = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      setQuedan(r);
      if (r === 0) {
        clearInterval(timer);
        // Un segundo de margen para que la pausa ya haya vencido también en el servidor.
        setTimeout(() => window.location.assign("/"), 1000);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [segundos]);

  const listo = quedan === 0;
  const reloj = `${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center md:py-24">
      <Hourglass size={40} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{T.titulo}</h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{T.bajada}</p>

      <div className="relative mt-10 size-44" role="timer" aria-label={T.restante}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RADIO} fill="none" strokeWidth="8" className="stroke-arena-200 dark:stroke-arena-800" />
          <circle
            cx="60"
            cy="60"
            r={RADIO}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCULO}
            strokeDashoffset={CIRCULO * (1 - quedan / SEGUNDOS_PAUSA)}
            className="stroke-oliva-600 transition-[stroke-dashoffset] duration-300 ease-linear dark:stroke-oliva-300"
          />
        </svg>
        <p className="absolute inset-0 grid place-items-center text-4xl font-semibold tabular-nums">{reloj}</p>
        {/* Para lectores de pantalla: solo cada 10 segundos, para no interrumpir todo el tiempo */}
        <p className="sr-only" aria-live="polite">
          {quedan % 10 === 0 ? T.segundos(quedan) : ""}
        </p>
      </div>

      <a
        href="/"
        aria-disabled={!listo}
        onClick={(e) => !listo && e.preventDefault()}
        className={`mt-10 inline-flex items-center rounded-xl px-5 py-3 font-medium transition ${
          listo
            ? "bg-oliva-700 text-white hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950"
            : "cursor-not-allowed bg-arena-200 text-arena-500 dark:bg-arena-800 dark:text-arena-400"
        }`}
      >
        {listo ? T.volver : T.esperar(quedan)}
      </a>
      <p className="mt-6 text-sm text-arena-500 dark:text-arena-400">{T.nota}</p>
    </main>
  );
}
