"use client";

import { useEffect, useState } from "react";

/** Si la persona tiene sesión iniciada y es Premium. null mientras se consulta (tratar como "todavía no"). */
export function usePremium(): boolean | null {
  const [premium, setPremium] = useState<boolean | null>(null);
  useEffect(() => {
    let activo = true;
    fetch("/api/cuenta/yo")
      .then((r) => r.json())
      .then((j) => {
        if (activo) setPremium(Boolean(j?.usuario?.premium));
      })
      .catch(() => {
        if (activo) setPremium(false);
      });
    return () => {
      activo = false;
    };
  }, []);
  return premium;
}
