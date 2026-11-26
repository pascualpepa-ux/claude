"use client";

import { Dices } from "lucide-react";

export function BotonAzar({ className = "", texto = "Jugar algo al azar" }: { className?: string; texto?: string }) {
  return (
    <button onClick={() => window.dispatchEvent(new Event("pf:azar"))} className={`group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ambar to-rosa px-6 py-3.5 font-bold text-fondo shadow-xl shadow-rosa/25 transition hover:scale-[1.03] hover:shadow-rosa/40 active:scale-95 ${className}`}>
      <Dices className="h-5 w-5 transition-transform duration-700 group-hover:rotate-[720deg]" /> {texto}
    </button>
  );
}
