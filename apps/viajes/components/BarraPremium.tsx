"use client";

import Link from "next/link";
import { Crown } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "./ProveedorIdioma";

/** Barra fina arriba de todo (antes que nada), para quienes todavía no son Premium. */
export function BarraPremium() {
  const { t } = useIdioma();
  const P = t.premium;
  return (
    <Link
      href="/premium"
      className="block bg-amber-500 px-4 py-2 text-center text-sm font-medium text-arena-950 transition hover:bg-amber-400"
    >
      <Crown size={16} weight="fill" className="mr-1.5 inline -translate-y-px" aria-hidden />
      {P.banner}
      <span className="ml-2 font-semibold underline underline-offset-2">{P.bannerBoton} →</span>
    </Link>
  );
}
