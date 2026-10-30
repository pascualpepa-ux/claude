// El guía del chat puede proponer un viaje concreto: lo marca al final de su respuesta con una línea
// [[VIAJE origen|destino|ida|vuelta|adultos|ciudad]] (aeropuertos IATA, fechas AAAA-MM-DD).
// La web saca esa línea del texto y muestra en su lugar una tarjeta con vuelos y hoteles reales para comprar.

export interface ViajeChat {
  origen: string;
  destino: string;
  ida: string;
  vuelta: string;
  adultos: number;
  ciudad: string;
}

const MARCA = /\[\[\s*VIAJE\s*([^\]]*)\]\]/i;
const IATA = /^[A-Z]{3}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const INSTRUCCION_VIAJE = (hoy: string) => `
Viajes concretos: la web puede mostrar vuelos y hoteles reales que se compran acá mismo.
Si la persona quiere hacer un viaje y ya sabés desde qué ciudad sale y a dónde va, terminá tu respuesta con esta línea exacta, sola, al final:
[[VIAJE origen|destino|ida|vuelta|adultos|ciudad]]
- origen y destino: código IATA de 3 letras del aeropuerto principal (Madrid MAD, Barcelona BCN, Buenos Aires EZE, Copenhague CPH, Roma FCO, Londres LHR, Nueva York JFK, París CDG).
- ida y vuelta: fechas AAAA-MM-DD, después de hoy (${hoy}). Si dice "en diciembre, 5 días", elegí fechas concretas razonables y decilas en tu respuesta.
- adultos: cuántas personas (1 si no dice).
- ciudad: el nombre de la ciudad de destino, en el idioma de la persona.
Ejemplo: [[VIAJE MAD|CPH|2026-12-10|2026-12-14|2|Copenhague]]
Si falta el origen o el destino, preguntalo y no pongas la línea. No escribas precios: debajo la web muestra los precios reales.`;

/** Separa el texto que se muestra de la propuesta de viaje (si la hay y es válida). */
export function separarViaje(texto: string, hoy: string): { texto: string; viaje: ViajeChat | null } {
  // Mientras llega la respuesta, un "[[" a medio escribir tampoco se muestra.
  const limpio = texto.replace(MARCA, "").replace(/\[\[[^\]]*$/, "").trim();
  const m = texto.match(MARCA);
  if (!m) return { texto: limpio, viaje: null };
  const [origen, destino, ida, vuelta, adultos, ...resto] = m[1].split("|").map((p) => p.trim());
  const viaje: ViajeChat = {
    origen: (origen ?? "").toUpperCase(),
    destino: (destino ?? "").toUpperCase(),
    ida: ida ?? "",
    vuelta: vuelta ?? "",
    adultos: Math.min(6, Math.max(1, Math.round(Number(adultos)) || 1)),
    ciudad: resto.join(" ").slice(0, 40) || (destino ?? "").toUpperCase(),
  };
  const valido =
    IATA.test(viaje.origen) && IATA.test(viaje.destino) && viaje.origen !== viaje.destino &&
    FECHA.test(viaje.ida) && FECHA.test(viaje.vuelta) && viaje.ida > hoy && viaje.vuelta > viaje.ida;
  return { texto: limpio, viaje: valido ? viaje : null };
}

/** Días que faltan desde hoy hasta una fecha AAAA-MM-DD (en el calendario local). */
export function diasHasta(fecha: string, ahora = new Date()): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const objetivo = new Date(a, m - 1, d);
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}
