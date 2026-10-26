import { CheckCircle, Question, Warning } from "@phosphor-icons/react/dist/ssr";
import { formatoConsulta } from "@/lib/fechas";
import type { Origen } from "@/lib/types";

const ESTILOS = {
  verificado: {
    texto: "Verificado",
    clase: "bg-oliva-50 text-oliva-800 ring-oliva-200 dark:bg-oliva-950/60 dark:text-oliva-300 dark:ring-oliva-900",
    Icono: CheckCircle,
  },
  estimado: {
    texto: "Precio estimado",
    clase: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    Icono: Warning,
  },
  no_verificado: {
    texto: "No verificado",
    clase: "bg-arena-100 text-arena-700 ring-arena-300 dark:bg-arena-800 dark:text-arena-300 dark:ring-arena-700",
    Icono: Question,
  },
} as const;

/** Etiqueta de verificación + fuente y hora de consulta de cada precio o dato. */
export function EstadoDato({ origen, textoEstimado }: { origen: Origen; textoEstimado?: string }) {
  const e = ESTILOS[origen.estado];
  const texto = origen.estado === "estimado" && textoEstimado ? textoEstimado : e.texto;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${e.clase}`}>
        <e.Icono size={14} weight="bold" aria-hidden />
        {texto}
      </span>
      <span className="text-arena-500 dark:text-arena-400">
        {origen.fuente}, consultado el {formatoConsulta(origen.consultadoEn)}
      </span>
    </span>
  );
}
