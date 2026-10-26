"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    goatcounter?: { no_onload?: boolean; count?: (v: { path: string }) => void };
  }
}

/**
 * Cuenta visitas con GoatCounter. La web navega sin recargar la página,
 * así que se cuenta a mano cada cambio de ruta. Las páginas de admin no se cuentan.
 */
export function ContadorVisitas({ codigo }: { codigo: string }) {
  const ruta = usePathname();

  useEffect(() => {
    if (!ruta || ruta.startsWith("/admin")) return;
    // El script puede tardar en cargar: se reintenta hasta que esté listo (máx. ~10 s).
    let intentos = 0;
    const t = setInterval(() => {
      if (window.goatcounter?.count) {
        window.goatcounter.count({ path: ruta });
        clearInterval(t);
      } else if (++intentos > 40) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [ruta]);

  return (
    <>
      <Script id="goatcounter-config" strategy="beforeInteractive">{`window.goatcounter = { no_onload: true };`}</Script>
      <Script
        data-goatcounter={`https://${codigo}.goatcounter.com/count`}
        src="https://gc.zgo.at/count.js"
        strategy="afterInteractive"
      />
    </>
  );
}
