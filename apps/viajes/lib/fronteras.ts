import FRONTERAS from "./fronteras.json";

// Fronteras de los países (Natural Earth 1:110m, dominio público, vía world-atlas), redondeadas a 0,1°.
// Solo el contorno de afuera de cada polígono. Los países muy chicos no están en esta escala.

export const BORDES = FRONTERAS as unknown as Record<string, [number, number][][]>;

/** ¿El punto está adentro del anillo? (rayo horizontal, en grados de longitud y latitud) */
function adentro(lon: number, lat: number, anillo: [number, number][]) {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

const superficie = (a: [number, number][]) => Math.abs(a.reduce((s, [x, y], i) => s + x * a[(i + 1) % a.length][1] - a[(i + 1) % a.length][0] * y, 0)) / 2;

/** País (código de 2 letras) en ese punto, o null si es mar. Si dos se superponen (Lesoto en Sudáfrica), gana el más chico. */
export function paisEn(lat: number, lon: number): string | null {
  let mejor: { codigo: string; area: number } | null = null;
  for (const [codigo, anillos] of Object.entries(BORDES)) {
    for (const a of anillos) {
      if (!adentro(lon, lat, a)) continue;
      const area = superficie(a);
      if (!mejor || area < mejor.area) mejor = { codigo, area };
    }
  }
  return mejor?.codigo ?? null;
}
