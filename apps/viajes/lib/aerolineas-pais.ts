/**
 * Aerolíneas principales de cada país (la de bandera primero). Sirven para sugerir con qué aerolíneas buscar
 * una ruta mientras no hay vuelos reales: no se afirma que vuelen esa ruta, solo que son las principales del país.
 * Para sumar un país: código ISO de 2 letras y sus aerolíneas.
 */
export const AEROLINEAS_PAIS: Record<string, string[]> = {
  AR: ["Aerolíneas Argentinas"],
  BR: ["LATAM", "GOL", "Azul"],
  CL: ["LATAM", "Sky Airline"],
  PE: ["LATAM"],
  CO: ["Avianca"],
  PA: ["Copa Airlines"],
  MX: ["Aeroméxico", "Volaris", "Viva Aerobus"],
  US: ["American Airlines", "Delta", "United"],
  CA: ["Air Canada", "WestJet"],
  ES: ["Iberia", "Air Europa", "Vueling"],
  PT: ["TAP Air Portugal"],
  FR: ["Air France"],
  IT: ["ITA Airways"],
  DE: ["Lufthansa"],
  GB: ["British Airways", "Virgin Atlantic"],
  IE: ["Aer Lingus"],
  NL: ["KLM"],
  BE: ["Brussels Airlines"],
  CH: ["Swiss"],
  AT: ["Austrian Airlines"],
  DK: ["SAS"],
  SE: ["SAS"],
  NO: ["SAS", "Norwegian"],
  FI: ["Finnair"],
  PL: ["LOT"],
  GR: ["Aegean"],
  TR: ["Turkish Airlines"],
  AE: ["Emirates", "Etihad"],
  QA: ["Qatar Airways"],
  IL: ["El Al"],
  EG: ["EgyptAir"],
  MA: ["Royal Air Maroc"],
  CN: ["Air China", "China Eastern", "China Southern"],
  JP: ["Japan Airlines", "ANA"],
  KR: ["Korean Air", "Asiana"],
  TH: ["Thai Airways"],
  SG: ["Singapore Airlines"],
  IN: ["Air India", "IndiGo"],
  AU: ["Qantas"],
  NZ: ["Air New Zealand"],
};

/** Hasta 5 aerolíneas para buscar una ruta: la preferida (si hay), las del país de destino y las del de origen. */
export function aerolineasParaRuta(paisOrigen: string | undefined, paisDestino: string | undefined, preferida = ""): string[] {
  const lista = [preferida.trim(), ...(AEROLINEAS_PAIS[paisDestino ?? ""] ?? []), ...(AEROLINEAS_PAIS[paisOrigen ?? ""] ?? [])].filter(Boolean);
  const vistas = new Set<string>();
  return lista.filter((a) => !vistas.has(a.toLowerCase()) && vistas.add(a.toLowerCase())).slice(0, 5);
}
