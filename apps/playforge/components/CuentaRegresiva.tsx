"use client";

import { useEffect, useState } from "react";

/** Cuenta regresiva hasta la próxima medianoche UTC (cuando cambia el desafío). */
export function CuentaRegresiva({ className = "" }: { className?: string }) {
  const [resto, setResto] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      const ahora = new Date();
      const fin = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1);
      setResto(Math.max(0, fin - ahora.getTime()));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((resto ?? 0) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`font-mono tabular-nums ${className}`} aria-label="Tiempo restante del desafío" suppressHydrationWarning>
      {resto === null ? "--:--:--" : `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`}
    </span>
  );
}
