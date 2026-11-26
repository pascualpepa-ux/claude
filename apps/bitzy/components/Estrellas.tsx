import { Star } from "lucide-react";

export function Estrellas({ valor, tam = "h-3.5 w-3.5" }: { valor: number; tam?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const lleno = Math.max(0, Math.min(1, valor - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={`${tam} text-capa-3`} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${lleno * 100}%` }}>
              <Star className={`${tam} text-ambar`} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
