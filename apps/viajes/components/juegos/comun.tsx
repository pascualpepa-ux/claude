"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

// Lo que comparten los juegos del admin: el código de ventaja, el lienzo y el bucle de animación.

const Ventaja = createContext<{ activa: boolean; activar: (codigo: string) => Promise<boolean> }>({
  activa: false,
  activar: async () => false,
});

export function ProveedorVentaja({ children }: { children: React.ReactNode }) {
  const [activa, setActiva] = useState(false);
  const activar = async (codigo: string) => {
    const r = await fetch("/api/admin/juegos/codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    }).catch(() => null);
    const ok = !!r && (await r.json().catch(() => ({ ok: false }))).ok === true;
    if (ok) setActiva(true);
    return ok;
  };
  return <Ventaja.Provider value={{ activa, activar }}>{children}</Ventaja.Provider>;
}

export const useVentaja = () => useContext(Ventaja).activa;

/** Casillero para el código: con el código correcto, cada juego da su ventaja. */
export function CampoCodigo({ queHace }: { queHace: string }) {
  const { activa, activar } = useContext(Ventaja);
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState<"inicio" | "probando" | "mal">("inicio");
  if (activa) {
    return <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">⚡ Ventaja activada: {queHace}</p>;
  }
  return (
    <form
      className="flex flex-wrap items-center gap-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setEstado("probando");
        setEstado((await activar(codigo)) ? "inicio" : "mal");
      }}
    >
      <label htmlFor="codigo-ventaja" className="text-arena-600 dark:text-arena-400">
        Código secreto
      </label>
      <input
        id="codigo-ventaja"
        type="password"
        autoComplete="off"
        value={codigo}
        onChange={(e) => {
          setCodigo(e.target.value);
          setEstado("inicio");
        }}
        className="h-9 w-40 rounded-lg border border-arena-300 bg-papel px-2 dark:border-arena-700 dark:bg-arena-950"
      />
      <button type="submit" disabled={estado === "probando"} className="h-9 rounded-lg bg-oliva-700 px-3 font-medium text-white disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950">
        Probar
      </button>
      {estado === "mal" && <span role="alert" className="text-red-700 dark:text-red-400">Código incorrecto</span>}
    </form>
  );
}

/** Lienzo de tamaño lógico fijo (ancho x alto) que se adapta al ancho de la pantalla y a la nitidez del dispositivo. */
export function useLienzo(ancho: number, alto: number) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = ancho * dpr;
    c.height = alto * dpr;
    c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [ancho, alto]);
  return ref;
}

/** Punto del puntero en coordenadas del juego. */
export function puntoEn(c: HTMLCanvasElement, e: { clientX: number; clientY: number }, ancho: number, alto: number) {
  const r = c.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * ancho, y: ((e.clientY - r.top) / r.height) * alto };
}

/** Llama a paso(dt) en cada cuadro mientras el juego está en pantalla. dt en segundos, con tope para no saltar. */
export function useBucle(paso: (dt: number) => void) {
  const ref = useRef(paso);
  ref.current = paso;
  useEffect(() => {
    let id = 0;
    let antes = performance.now();
    const cuadro = (ahora: number) => {
      const dt = Math.min((ahora - antes) / 1000, 1 / 30);
      antes = ahora;
      ref.current(dt);
      id = requestAnimationFrame(cuadro);
    };
    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, []);
}

export const COLOR = {
  oliva: "#575b40",
  olivaOscuro: "#3a3d2c",
  olivaClaro: "#b8be8e",
  crema: "#f2ecdc",
  papel: "#fffdf7",
  arena: "#e6dec8",
  tinta: "#211f19",
  ambar: "#fcd34d",
  rojo: "#c2410c",
};

export const claseLienzo = "block w-full max-w-[480px] touch-none rounded-2xl border border-arena-200 select-none dark:border-arena-800";
