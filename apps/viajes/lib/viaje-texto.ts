import { buscarLugares } from "./lugares";
import { formatoCorto, sumarDias } from "./fechas";
import type { Idioma } from "./idioma";
import type { ViajeChat } from "./viaje-chat";
import { paisPorCodigo } from "./paises";

// Entiende un pedido de viaje escrito en el chat ("quiero ir de Madrid a Roma 4 días en diciembre, somos 2")
// sin IA: busca las ciudades en los datos de lugares, y saca días, mes y personas con reglas simples.
// Si falta algo esencial (de dónde sale o a dónde va), lo pregunta. Solo servidor (usa lib/lugares).

const LUGAR = String.raw`([\p{L}][\p{L} .'-]{1,30}?)`;
const CORTE = String.raw`(?=\s+(?:a|al|hasta|hacia|para|to|en|el|del|por|somos|con|y|and|for|in|on|unos?|durante|\d)\b|\s*[,.;!?\d]|$)`;
const DE_A = new RegExp(String.raw`(?:desde|de|from)\s+${LUGAR}\s+(?:a|al|hasta|hacia|to)\s+${LUGAR}${CORTE}`, "giu");
const SOLO_DESTINO = new RegExp(String.raw`(?:ir a|ir al|viajar a|viaje a|escapada a|vacaciones en|conocer|go to|trip to|travel to|visit)\s+${LUGAR}${CORTE}`, "giu");
const SOLO_ORIGEN = new RegExp(String.raw`(?:desde|salgo de|salimos de|saliendo de|vivo en|from|leaving from)\s+${LUGAR}${CORTE}`, "giu");

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const NUMEROS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const NO_LUGARES = new Set([...Object.keys(MESES), ...Object.keys(NUMEROS), "vacaciones", "viaje", "mi", "mis", "la", "las", "los", "un", "una", "the", "my", "holiday", "holidays", "vacation"]);

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const numero = (t: string) => (/^\d+$/.test(t) ? Number(t) : NUMEROS[normal(t)]);

/** Aeropuerto de un nombre escrito: ciudad (o país) que coincida bien, con aeropuerto. */
function aeropuertoDe(nombre: string): { iata: string; ciudad: string } | null {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  if (limpio.length < 3 || NO_LUGARES.has(normal(limpio))) return null;
  // Primero ciudades ("Roma" es Roma, no Rumania); si no hay, países ("Japón").
  const [l] = buscarLugares(limpio, 1, false).length ? buscarLugares(limpio, 1, false) : buscarLugares(limpio, 1, true);
  if (!l) return null;
  const visible = l.tipo === "pais" ? limpio : l.ciudad;
  // La coincidencia tiene que ser clara: "Roma" → Roma, no cualquier ciudad que tenga "rom" adentro.
  if (l.tipo === "ciudad" && !normal(l.ciudad).startsWith(normal(limpio).slice(0, 4))) {
    const otros = buscarLugares(limpio, 1, false)[0];
    if (!otros || !normal(otros.ciudad).includes(normal(limpio).slice(0, 4))) return null;
  }
  // En las capitales, el aeropuerto principal (Roma: Fiumicino, no Ciampino); si no, el internacional más cercano.
  const principal = paisPorCodigo(l.pais)?.aeropuerto;
  const iata =
    l.tipo === "pais"
      ? l.ciudades?.[0]?.iata
      : (l.aeropuertos.find((a) => a.iata === principal) ?? l.aeropuertos.find((a) => a.internacional) ?? l.aeropuertos[0])?.iata;
  return iata ? { iata, ciudad: visible } : null;
}

function ultimo(re: RegExp, texto: string) {
  return [...texto.matchAll(re)].at(-1) ?? null;
}

export type Entendido =
  | { tipo: "viaje"; viaje: ViajeChat; respuesta: string }
  | { tipo: "falta_origen"; respuesta: string }
  | null;

/**
 * Lee los últimos mensajes de la persona (el más nuevo manda) y arma el viaje.
 * null si no parece un pedido de viaje: así el chat responde como siempre.
 */
export function entenderViaje(mensajes: string[], idioma: Idioma, hoy: string): Entendido {
  const texto = mensajes.slice(-3).join(" . ");
  let origen: ReturnType<typeof aeropuertoDe> = null;
  let destino: ReturnType<typeof aeropuertoDe> = null;
  const deA = ultimo(DE_A, texto);
  if (deA) {
    origen = aeropuertoDe(deA[1]);
    destino = aeropuertoDe(deA[2]);
  }
  if (!destino) {
    const d = ultimo(SOLO_DESTINO, texto);
    if (d) destino = aeropuertoDe(d[1]);
  }
  if (!origen) {
    const o = ultimo(SOLO_ORIGEN, texto);
    if (o && (!deA || o.index !== deA.index)) origen = aeropuertoDe(o[1]);
  }
  if (!destino) return null;
  if (!origen) {
    return {
      tipo: "falta_origen",
      respuesta:
        idioma === "es"
          ? `¡${destino.ciudad} está buenísimo! ¿Desde qué ciudad salís? Decime, por ejemplo, "desde Madrid", y te busco vuelos y hoteles reales.`
          : `${destino.ciudad} is a great pick! Which city are you leaving from? Say, for example, "from London" and I'll find real flights and hotels.`,
    };
  }
  if (origen.iata === destino.iata) return null;

  const t = normal(texto);
  const dias = Math.min(21, Math.max(1, numero(t.match(/(\d+|\p{L}+)\s+(?:dias|noches|days|nights)/u)?.[1] ?? "") || 4));
  const personas = Math.min(6, Math.max(1, numero(t.match(/(\d+|\p{L}+)\s+(?:personas|adultos|people|adults)/u)?.[1] ?? "") || numero(t.match(/(?:somos|seremos|we are)\s+(\d+|\p{L}+)/u)?.[1] ?? "") || numero(t.match(/(?:para|for)\s+(\d+|\p{L}+)(?!\s+(?:dias|days|noches|nights))\b/u)?.[1] ?? "") || (/\b(?:con mi (?:novia|novio|pareja|esposa|esposo|mujer|marido)|with my (?:wife|husband|partner|girlfriend|boyfriend))\b/.test(t) ? 2 : 1)));

  // Fecha de ida: un día del mes que nombró (el 10 si no dijo cuál), o dentro de un mes.
  const [anio, mesHoy, diaHoy] = hoy.split("-").map(Number);
  const mesTexto = [...t.matchAll(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)\b/g)].at(-1)?.[1];
  let ida = sumarDias(hoy, 30);
  if (mesTexto) {
    const mes = MESES[mesTexto];
    const diaPedido = Number(t.match(new RegExp(String.raw`(\d{1,2})\s+(?:de\s+)?${mesTexto}`))?.[1]) || 0;
    let a = anio;
    if (mes < mesHoy || (mes === mesHoy && (diaPedido || 10) <= diaHoy + 2)) a += mes === mesHoy && !diaPedido ? 0 : 1;
    const dia = diaPedido >= 1 && diaPedido <= 28 ? diaPedido : 10;
    ida = `${a}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    if (ida <= sumarDias(hoy, 2)) ida = sumarDias(hoy, 14); // este mismo mes y ya pasó el 10: en dos semanas
  }
  const vuelta = sumarDias(ida, dias);
  const viaje: ViajeChat = { origen: origen.iata, destino: destino.iata, ida, vuelta, adultos: personas, ciudad: destino.ciudad };
  const fechas = `${formatoCorto(ida, idioma)} – ${formatoCorto(vuelta, idioma)}`;
  const respuesta =
    idioma === "es"
      ? `¡Dale! Te armé el viaje de ${origen.ciudad} a ${destino.ciudad}: ${fechas} (${dias} ${dias === 1 ? "día" : "días"}), ${personas === 1 ? "1 persona" : `${personas} personas`}. Abajo tenés el vuelo y el hotel más baratos que encontramos, con precio real. Si querés otras fechas, decímelas (por ejemplo "del 5 de diciembre, 6 días").`
      : `Done! Here's your trip from ${origen.ciudad} to ${destino.ciudad}: ${fechas} (${dias} ${dias === 1 ? "day" : "days"}), ${personas === 1 ? "1 person" : `${personas} people`}. Below are the cheapest flight and hotel we found, with real prices. Want other dates? Just say so (e.g. "December 5, 6 days").`;
  return { tipo: "viaje", viaje, respuesta: `${respuesta}\n[[VIAJE ${viaje.origen}|${viaje.destino}|${ida}|${vuelta}|${personas}|${destino.ciudad}]]` };
}
