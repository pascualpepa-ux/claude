import type { Idioma } from "../idioma";

/** Un texto en cada idioma de la web. */
export type Texto = Record<Idioma, string>;

/** Rango en dólares por persona y por día, sin el vuelo: [mínimo, máximo]. */
export type Rango = [number, number];

export interface PrecioGuia {
  concepto: Texto;
  /** Monto tal como se paga allá (ej. "€18"); los verificados llevan su web oficial. */
  monto: Texto;
  enlace?: string;
  verificado?: boolean;
}

export interface Guia {
  slug: string;
  dias: number;
  /** Palabras (sin tildes, en minúscula) con las que el chat de ayuda reconoce el destino. */
  claves: string[];
  /** Cómo encontrar el destino en el buscador del asistente: nombre y país (ISO de 2 letras). */
  destino: { buscar: string; pais: string; tipo: "ciudad" | "pais" };
  /** Mes de la última revisión de precios (AAAA-MM). */
  revisado: string;
  titulo: Texto;
  descripcion: Texto;
  intro: Texto;
  itinerario: { titulo: Texto; actividades: Texto[] }[];
  precios: PrecioGuia[];
  porDia: { economico: Rango; equilibrado: Rango; premium: Rango };
  consejos: Texto[];
}
