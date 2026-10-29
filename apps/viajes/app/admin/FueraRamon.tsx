"use client";

import { useEffect, useRef, useState } from "react";

/** Broma: lo que ve quien entra al admin sin la llave del dispositivo del dueño. */
export function FueraRamon() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [veces, setVeces] = useState(0);
  const tirar = () => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
    setVeces((v) => v + 1);
  };
  useEffect(() => {
    // Los navegadores suelen frenar el sonido hasta que la persona toca la pantalla: se intenta igual.
    tirar();
    const alTocar = () => tirar();
    window.addEventListener("pointerdown", alTocar);
    return () => window.removeEventListener("pointerdown", alTocar);
  }, []);
  return (
    <main className="fuera-ramon relative flex min-h-[80dvh] flex-col items-center justify-center overflow-hidden bg-oliva-800 px-4 py-16 text-center text-arena-50 select-none">
      <audio ref={audio} src="/sonidos/pedo.mp3" preload="auto" />
      <div className="nube" aria-hidden>💨</div>
      <div className="patada text-[110px] leading-none md:text-[160px]" aria-hidden>
        🦶
      </div>
      <h1 className="titulo mt-6 text-6xl font-black tracking-tight uppercase md:text-9xl">
        Get out
        <br />
        <span className="text-amber-300">Ramón</span>
      </h1>
      <p className="mt-6 text-xl text-arena-200 md:text-2xl">🚪👉 Este admin no es tuyo.</p>
      <button type="button" onClick={tirar} className="mt-8 rounded-2xl bg-amber-300 px-8 py-4 text-2xl font-bold text-arena-950 transition active:scale-95">
        No toques acá 🙊
      </button>
      {veces > 1 && <p className="mt-4 text-arena-300">Pedos tirados: {veces}</p>}
      <style>{`
        .fuera-ramon .titulo { animation: temblar 0.35s infinite; }
        .fuera-ramon .patada { animation: patear 0.9s ease-in-out infinite; transform-origin: 30% 80%; }
        .fuera-ramon .nube { position: absolute; font-size: 90px; animation: volar 2.2s linear infinite; opacity: 0.8; }
        @keyframes temblar {
          0%, 100% { transform: translate(0, 0) rotate(0); }
          25% { transform: translate(-6px, 3px) rotate(-2deg); }
          50% { transform: translate(5px, -4px) rotate(2deg); }
          75% { transform: translate(-3px, -2px) rotate(-1deg); }
        }
        @keyframes patear {
          0%, 100% { transform: rotate(-25deg) translateX(-30px); }
          50% { transform: rotate(35deg) translateX(40px); }
        }
        @keyframes volar {
          from { left: -120px; top: 65%; }
          to { left: 110%; top: 20%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fuera-ramon .titulo, .fuera-ramon .patada, .fuera-ramon .nube { animation: none; }
        }
      `}</style>
    </main>
  );
}
