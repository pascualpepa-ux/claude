/**
 * Hora de embarque aproximada. Ningún buscador de vuelos la publica: la da la aerolínea en la tarjeta de embarque.
 * Las aerolíneas suelen empezar a embarcar unos 35 minutos antes en vuelos cortos y unos 50 en los largos (6 h o más).
 */
export function minutosEmbarque(duracionMin: number) {
  return duracionMin >= 360 ? 50 : 35;
}

export function horaEmbarque(salidaIso: string, duracionMin: number): string {
  return new Date(new Date(salidaIso).getTime() - minutosEmbarque(duracionMin) * 60_000).toISOString();
}

/** Días de diferencia entre la salida y la llegada (en horas locales): 0, 1 (+1) o más. */
export function diasDespues(salidaIso: string, llegadaIso: string) {
  return Math.round((Date.parse(llegadaIso.slice(0, 10)) - Date.parse(salidaIso.slice(0, 10))) / 86_400_000);
}
