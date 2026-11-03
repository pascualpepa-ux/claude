/** Nombre en español de los idiomas más habituales en reseñas (código ISO 639-1). */
const NAMES: Record<string, string> = {
  es: "Español", en: "Inglés", ca: "Catalán", fr: "Francés", it: "Italiano", pt: "Portugués",
  de: "Alemán", nl: "Neerlandés", gl: "Gallego", eu: "Euskera", ru: "Ruso", zh: "Chino", ja: "Japonés",
};

export function languageName(code?: string | null) {
  if (!code) return null;
  return NAMES[code] ?? code.toUpperCase();
}
