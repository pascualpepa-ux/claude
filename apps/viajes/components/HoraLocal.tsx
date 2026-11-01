"use client";

import { useEffect, useState } from "react";

/** Hora de ahora en otra zona horaria; se actualiza sola cada medio minuto. */
export function HoraLocal({ zona, locale }: { zona: string; locale: string }) {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!ahora) return <span className="tabular-nums">--:--</span>;
  try {
    return <span className="tabular-nums">{ahora.toLocaleTimeString(locale, { timeZone: zona, hour: "2-digit", minute: "2-digit" })}</span>;
  } catch {
    return <span className="tabular-nums">--:--</span>;
  }
}
