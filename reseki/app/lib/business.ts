/**
 * Tipos de negocio. Reseki sirve para cualquier negocio con ficha en Google;
 * el tipo ajusta cómo escribe la IA, la reseña de ejemplo y las reseñas del modo demo.
 */
export const BUSINESS_TYPES = [
  { value: "restaurante", label: "Restaurante o bar", ai: "restaurante o bar" },
  { value: "cafeteria", label: "Cafetería o panadería", ai: "cafetería o panadería" },
  { value: "tienda", label: "Tienda", ai: "tienda" },
  { value: "belleza", label: "Peluquería o estética", ai: "peluquería o centro de estética" },
  { value: "alojamiento", label: "Hotel o alojamiento", ai: "hotel o alojamiento turístico" },
  { value: "salud", label: "Clínica o salud", ai: "clínica o centro de salud" },
  { value: "servicios", label: "Taller o servicios", ai: "taller o empresa de servicios" },
  { value: "otro", label: "Otro", ai: "negocio local" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export function businessLabel(t: string) {
  return BUSINESS_TYPES.find((b) => b.value === t)?.ai ?? "negocio local";
}

/** ¿Usa el catálogo de reseñas de hostelería (comida, mesas) o el genérico? */
export const isFoodBusiness = (t: string) => t === "restaurante" || t === "cafeteria";
