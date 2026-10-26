import { resolverDestino, type CiudadBase } from "./destinos";
import { diferenciaDias, hoy, sumarDias } from "./fechas";
import type { Idioma } from "./idioma";
import type {
  Actividad,
  ClimaDia,
  Condicion,
  DiaItinerario,
  OpcionHotel,
  OpcionVuelo,
  Origen,
  Plan,
  TipoHotel,
  TramoCiudad,
  Traslado,
  TripInput,
  TripPlan,
} from "./types";

/**
 * Generador de datos de ejemplo (fase 1). Simula lo que en la fase 3 van a
 * devolver los agentes buscadores y verificadores. Es determinístico: el mismo
 * pedido produce siempre el mismo viaje.
 */

/** Textos del contenido generado (consejos, notas, condiciones), en los dos idiomas. */
const TX = {
  es: {
    fuente: "Datos de ejemplo",
    tormenta: "Día de tormenta: priorizá museos y lugares cubiertos.",
    lluvia: "Llevá paraguas. Dejamos para hoy los planes bajo techo.",
    calor: "Hace calor: hidratate y evitá el sol del mediodía.",
    frio: "Frío: abrigo, guantes y planes cortos al aire libre.",
    sol: "Buen día para caminar y hacer planes al aire libre.",
    templado: "Clima templado: sirve tanto para paseos como para museos.",
    llegada: (c: string) => `Llegada a ${c}. Check-in y primera recorrida tranquila.`,
    ultimo: "Último día: check-out y traslado al aeropuerto.",
    trasladoNota: (c: string) => `Traslado en tren a ${c} por la mañana.`,
    tren: "Tren rápido",
    mano: "Incluye equipaje de mano de hasta 8 kg",
    valijaIncluida: "Incluye 1 valija de 23 kg",
    valijaSumada: "Valija de 23 kg sumada al precio (US$ 140 ida y vuelta)",
    valijaNo: "Valija no incluida (US$ 140 ida y vuelta si la agregás)",
    sinCambios: "No permite cambios",
    cambios: (m: number) => `Cambios con cargo de US$ ${m}`,
    reembolsable: "Reembolsable con penalidad del 20%",
    noReembolsable: "No reembolsable",
    busquedaVuelo: (o: string, d: string, ida: string, vuelta: string, a: string) => `vuelos de ${o} a ${d} ${ida} vuelta ${vuelta} ${a}`,
    hoteles: {
      hostel: (z: string[]) => [`Hostel Casa ${z[0]}`, `${z[1]} Backpackers`, `Hostel del Puerto ${z[2]}`],
      depto: (z: string[]) => [`Departamento luminoso en ${z[0]}`, `Loft con balcón en ${z[1]}`, `Departamento familiar en ${z[2]}`],
      hotel: (z: string[]) => [`Hotel Jardín ${z[0]}`, `${z[1]} Suites`, `Gran Hotel ${z[2]}`],
    },
    desayunoSi: "Desayuno incluido",
    desayunoNo: "Desayuno no incluido",
    cancelacion: (h: number) => `Cancelación gratis hasta ${h} h antes`,
    checkIn: (h: string) => `Check-in desde las ${h}`,
    checkOut: (h: string) => `Check-out hasta las ${h}`,
  },
  en: {
    fuente: "Sample data",
    tormenta: "Stormy day: go for museums and indoor places.",
    lluvia: "Bring an umbrella. We kept today's plans indoors.",
    calor: "It's hot: stay hydrated and avoid the midday sun.",
    frio: "Cold: coat, gloves and short outdoor plans.",
    sol: "A good day for walking and outdoor plans.",
    templado: "Mild weather: works for both walks and museums.",
    llegada: (c: string) => `Arrival in ${c}. Check in and take an easy first walk.`,
    ultimo: "Last day: check out and head to the airport.",
    trasladoNota: (c: string) => `Morning train to ${c}.`,
    tren: "High-speed train",
    mano: "Includes carry-on bag up to 8 kg",
    valijaIncluida: "Includes 1 checked bag of 23 kg",
    valijaSumada: "23 kg checked bag added to the price (US$ 140 round trip)",
    valijaNo: "Checked bag not included (US$ 140 round trip if you add it)",
    sinCambios: "No changes allowed",
    cambios: (m: number) => `Changes for a US$ ${m} fee`,
    reembolsable: "Refundable with a 20% penalty",
    noReembolsable: "Non-refundable",
    busquedaVuelo: (o: string, d: string, ida: string, vuelta: string, a: string) => `flights from ${o} to ${d} ${ida} return ${vuelta} ${a}`,
    hoteles: {
      hostel: (z: string[]) => [`Casa ${z[0]} Hostel`, `${z[1]} Backpackers`, `Harbor Hostel ${z[2]}`],
      depto: (z: string[]) => [`Bright apartment in ${z[0]}`, `Loft with balcony in ${z[1]}`, `Family apartment in ${z[2]}`],
      hotel: (z: string[]) => [`Garden Hotel ${z[0]}`, `${z[1]} Suites`, `Grand Hotel ${z[2]}`],
    },
    desayunoSi: "Breakfast included",
    desayunoNo: "Breakfast not included",
    cancelacion: (h: number) => `Free cancellation up to ${h} h before`,
    checkIn: (h: string) => `Check-in from ${h}`,
    checkOut: (h: string) => `Check-out by ${h}`,
  },
};

/** Hora "HH:MM" en el formato de cada idioma. */
function hora(hhmm: string, idioma: Idioma) {
  if (idioma === "es") return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function semilla(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function azar(texto: string) {
  let t = semilla(texto);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (r: () => number, min: number, max: number) => min + r() * (max - min);
const redondear = (n: number, paso = 5) => Math.round(n / paso) * paso;

function origen(idioma: Idioma, consultadoEn: string, estado: Origen["estado"] = "verificado"): Origen {
  return { fuente: TX[idioma].fuente, consultadoEn, estado };
}

/** Reparte las noches entre ciudades según su peso, con al menos una noche cada una. */
export function repartirNoches(pesos: number[], noches: number): number[] {
  const n = Math.min(pesos.length, Math.max(1, noches));
  const usados = pesos.slice(0, n);
  const totalPeso = usados.reduce((s, p) => s + p, 0);
  const reparto = usados.map((p) => Math.max(1, Math.floor((p / totalPeso) * noches)));
  let resto = noches - reparto.reduce((s, x) => s + x, 0);
  for (let i = 0; resto !== 0 && i < 100; i++) {
    const idx = i % n;
    if (resto > 0) {
      reparto[idx]++;
      resto--;
    } else if (reparto[idx] > 1) {
      reparto[idx]--;
      resto++;
    }
  }
  return reparto;
}

function cantidadCiudades(dias: number): number {
  if (dias <= 4) return 1;
  if (dias <= 8) return 2;
  return 3;
}

const COSTO_COMIDA: Record<Plan, number> = { economico: 22, equilibrado: 40, premium: 85 };
const COSTO_TRANSPORTE: Record<Plan, number> = { economico: 6, equilibrado: 12, premium: 30 };
const PRECIO_HOTEL: Record<TipoHotel, number> = { hostel: 28, "3": 75, "4": 125, "5": 260, depto: 95 };
const MULT_CLASE = { economica: 1, premium: 1.7, business: 3.2 } as const;

function clima(ciudad: string, fecha: string, idioma: Idioma): ClimaDia {
  const r = azar(`${ciudad}|${fecha}`);
  const mes = Number(fecha.slice(5, 7));
  const estacional = 14 + 11 * Math.cos(((mes - 7) / 12) * 2 * Math.PI);
  const maxima = Math.round(estacional + entre(r, -3, 4));
  const minima = maxima - Math.round(entre(r, 5, 10));
  const tirada = r();
  const condicion: Condicion =
    tirada < 0.32 ? "soleado" : tirada < 0.58 ? "parcial" : tirada < 0.78 ? "nublado" : tirada < 0.94 ? "lluvia" : "tormenta";
  const probLluvia =
    condicion === "lluvia" || condicion === "tormenta"
      ? Math.round(entre(r, 65, 95))
      : condicion === "nublado"
        ? Math.round(entre(r, 20, 45))
        : Math.round(entre(r, 0, 15));
  const anticipacion = diferenciaDias(hoy(), fecha);
  const confianza = anticipacion <= 5 ? "alta" : anticipacion <= 10 ? "media" : "baja";
  return {
    fecha,
    condicion,
    maxima,
    minima,
    probLluvia,
    confianza,
    origen: origen(idioma, new Date().toISOString(), confianza === "baja" ? "estimado" : "verificado"),
  };
}

function consejoClima(c: ClimaDia, idioma: Idioma): string {
  const t = TX[idioma];
  if (c.condicion === "tormenta") return t.tormenta;
  if (c.condicion === "lluvia") return t.lluvia;
  if (c.maxima >= 29) return t.calor;
  if (c.maxima <= 8) return t.frio;
  if (c.condicion === "soleado") return t.sol;
  return t.templado;
}

function armarVuelos(input: TripInput, destino: CiudadBase, regreso: CiudadBase, aerolineas: string[], ahora: string, idioma: Idioma): OpcionVuelo[] {
  const t = TX[idioma];
  const r = azar(`vuelos|${input.origen}|${input.destino}|${input.fechaIda}`);
  const lista = input.aerolinea.trim()
    ? [input.aerolinea.trim(), ...aerolineas.filter((x) => x.toLowerCase() !== input.aerolinea.trim().toLowerCase())]
    : aerolineas;
  const escalasPosibles = ["MAD", "DOH", "DXB", "GRU", "AMS", "FRA"];
  const base = entre(r, 780, 1250) * MULT_CLASE[input.clase];
  const perfiles = [
    { escalas: 0, factor: 1.32, valijaIncluida: true, estado: "verificado" as const },
    { escalas: 1, factor: 1.0, valijaIncluida: true, estado: "verificado" as const },
    { escalas: 2, factor: 0.82, valijaIncluida: false, estado: "estimado" as const },
  ];
  const origenCodigo = input.aeropuertoOrigen || input.origen.trim().slice(0, 3).toUpperCase() || "EZE";
  return perfiles.map((p, i) => {
    const aerolinea = lista[i % lista.length];
    const duracionIda = Math.round(entre(r, 14, 18) * 60 + p.escalas * entre(r, 120, 240));
    const duracionVuelta = Math.round(duracionIda + entre(r, -60, 60));
    const escalas = Array.from({ length: p.escalas }, (_, k) => escalasPosibles[(i * 2 + k) % escalasPosibles.length]);
    const salidaIda = new Date(`${input.fechaIda}T${["22:40", "13:15", "06:05"][i]}:00Z`);
    const salidaVuelta = new Date(`${input.fechaVuelta}T${["11:20", "18:45", "09:30"][i]}:00Z`);
    const recargoValija = input.equipaje === "valija" && !p.valijaIncluida ? 140 : 0;
    const precioPorPersona = redondear(base * p.factor) + recargoValija;
    const busqueda = t.busquedaVuelo(input.origen, destino.nombre[idioma], input.fechaIda, input.fechaVuelta, aerolinea);
    return {
      id: `vuelo-${i}`,
      aerolinea,
      clase: input.clase,
      ida: {
        desde: origenCodigo,
        hasta: destino.aeropuerto,
        salida: salidaIda.toISOString(),
        llegada: new Date(salidaIda.getTime() + duracionIda * 60_000).toISOString(),
        escalas,
        duracionMin: duracionIda,
      },
      vuelta: {
        desde: regreso.aeropuerto,
        hasta: origenCodigo,
        salida: salidaVuelta.toISOString(),
        llegada: new Date(salidaVuelta.getTime() + duracionVuelta * 60_000).toISOString(),
        escalas: [...escalas].reverse(),
        duracionMin: duracionVuelta,
      },
      precioPorPersona,
      condiciones: {
        equipajeMano: t.mano,
        valija: p.valijaIncluida ? t.valijaIncluida : input.equipaje === "valija" ? t.valijaSumada : t.valijaNo,
        cambios: p.escalas === 2 ? t.sinCambios : t.cambios(p.escalas === 0 ? 100 : 180),
        reembolso: p.escalas === 0 ? t.reembolsable : t.noReembolsable,
      },
      linkReserva: `https://www.google.com/travel/flights?hl=${idioma}&q=${encodeURIComponent(busqueda)}`,
      origen: origen(idioma, ahora, p.estado),
    };
  });
}

function nombresHotel(tipo: TipoHotel, zonas: string[], idioma: Idioma): string[] {
  const [z1, z2 = z1, z3 = z2] = zonas;
  const plantillas = TX[idioma].hoteles;
  return (tipo === "hostel" ? plantillas.hostel : tipo === "depto" ? plantillas.depto : plantillas.hotel)([z1, z2, z3]);
}

function habitacionesPara(tipo: TipoHotel, personas: number): number {
  if (tipo === "hostel") return personas; // camas
  if (tipo === "depto") return Math.ceil(personas / 4);
  return Math.ceil(personas / 2);
}

function armarHoteles(input: TripInput, ciudad: CiudadBase, ahora: string, idioma: Idioma): OpcionHotel[] {
  const t = TX[idioma];
  const r = azar(`hoteles|${ciudad.clave}|${input.tipoHotel}|${input.fechaIda}`);
  const zonas = ciudad.zonas.map((z) => z[idioma]);
  const nombres = nombresHotel(input.tipoHotel, zonas, idioma);
  const preferido = input.hotelPreferido.trim();
  if (preferido) nombres[0] = preferido;
  const factores = [1.25, 1, 0.82];
  const habitaciones = habitacionesPara(input.tipoHotel, input.viajeros.length);
  return nombres.map((nombre, i) => {
    const esPreferido = preferido && i === 0;
    const precioNoche = redondear(PRECIO_HOTEL[input.tipoHotel] * ciudad.costo * factores[i] * entre(r, 0.9, 1.15));
    return {
      id: `${ciudad.clave}-hotel-${i}`,
      ciudad: ciudad.nombre[idioma],
      nombre,
      tipo: input.tipoHotel,
      zona: zonas[i % zonas.length],
      precioNoche,
      impuestosPct: Math.round(entre(r, 8, 16)),
      habitaciones,
      condiciones: {
        desayuno: i === 2 ? t.desayunoNo : t.desayunoSi,
        cancelacion: i === 2 ? t.noReembolsable : t.cancelacion(i === 0 ? 72 : 48),
        checkIn: t.checkIn(hora(i === 1 ? "14:00" : "15:00", idioma)),
        checkOut: t.checkOut(hora(i === 0 ? "12:00" : "11:00", idioma)),
      },
      linkReserva: `https://www.google.com/travel/search?hl=${idioma}&q=${encodeURIComponent(`${nombre} ${ciudad.nombre[idioma]}`)}`,
      // Un hotel elegido por el usuario no se puede confirmar con datos de ejemplo.
      origen: origen(idioma, ahora, esPreferido ? "no_verificado" : i === 2 ? "estimado" : "verificado"),
    };
  });
}

function elegirPorPlan<T>(opciones: T[], precio: (o: T) => number, plan: Plan): T {
  const orden = [...opciones].sort((x, y) => precio(x) - precio(y));
  if (plan === "economico") return orden[0];
  if (plan === "premium") return orden[orden.length - 1];
  return orden[Math.floor(orden.length / 2)];
}

function ubicarActividades(dias: DiaItinerario[], actividades: Actividad[], plan: Plan) {
  const usadas = new Set<string>();
  const porDia = plan === "premium" ? 3 : 2;
  dias.forEach((dia, i) => {
    const esExtremo = i === 0 || i === dias.length - 1;
    const cupo = esExtremo ? 1 : porDia;
    const mojado = dia.clima.condicion === "lluvia" || dia.clima.condicion === "tormenta";
    const seco = dia.clima.condicion === "soleado" || dia.clima.condicion === "parcial";
    const candidatas = actividades
      .filter((a) => a.ciudad === dia.ciudad && !usadas.has(a.id))
      .filter((a) => !(mojado && a.aireLibre))
      .sort((x, y) => Number(y.aireLibre === seco) - Number(x.aireLibre === seco) || Number(y.tipo === "imperdible") - Number(x.tipo === "imperdible"));
    let horas = 0;
    for (const act of candidatas) {
      if (dia.actividades.length >= cupo) break;
      if (horas + act.horas > (esExtremo ? 4 : 9)) continue;
      dia.actividades.push(act.id);
      usadas.add(act.id);
      horas += act.horas;
    }
  });
}

export function generarViaje(input: TripInput, idioma: Idioma = "es"): TripPlan {
  const t = TX[idioma];
  const ahora = new Date().toISOString();
  const noches = Math.max(1, diferenciaDias(input.fechaIda, input.fechaVuelta));
  const totalDias = noches + 1;
  const res = resolverDestino(input.destino);

  let ciudades: CiudadBase[];
  let aerolineas: string[];
  if (res.tipo === "pais") {
    ciudades = res.pais.ciudades.slice(0, cantidadCiudades(totalDias));
    aerolineas = res.pais.aerolineas;
  } else {
    ciudades = [res.ciudad];
    aerolineas = res.pais?.aerolineas ?? ["Aerolíneas Argentinas", "LATAM", "Iberia"];
  }

  const nochesPorCiudad = repartirNoches(ciudades.map((c) => c.peso), noches);
  ciudades = ciudades.slice(0, nochesPorCiudad.length);
  const nombre = (c: CiudadBase) => c.nombre[idioma];
  const ruta: TramoCiudad[] = ciudades.map((c, i) => ({ clave: c.clave, ciudad: nombre(c), dias: nochesPorCiudad[i] }));

  // Los ids usan la clave de la ciudad: no cambian al cambiar de idioma, así se conservan las elecciones.
  const actividades: Actividad[] = ciudades.flatMap((c) =>
    c.actividades.map((a, i) => ({
      id: `${c.clave}-act-${i}`,
      ciudad: nombre(c),
      nombre: a.nombre[idioma],
      tipo: a.tipo,
      aireLibre: a.aireLibre,
      precioPorPersona: a.precio,
      horas: a.horas,
    })),
  );

  const dias: DiaItinerario[] = [];
  const traslados: Traslado[] = [];
  let ciudadIdx = 0;
  let nochesEnCiudad = 0;
  for (let d = 0; d < totalDias; d++) {
    const fecha = sumarDias(input.fechaIda, d);
    if (d > 0 && nochesEnCiudad >= nochesPorCiudad[ciudadIdx] && ciudadIdx < ciudades.length - 1) {
      const desde = nombre(ciudades[ciudadIdx]);
      ciudadIdx++;
      nochesEnCiudad = 0;
      traslados.push({
        fecha,
        desde,
        hasta: nombre(ciudades[ciudadIdx]),
        medio: t.tren,
        precioPorPersona: redondear(70 * ciudades[ciudadIdx].costo),
        origen: origen(idioma, ahora, "estimado"),
      });
    }
    const ciudad = nombre(ciudades[ciudadIdx]);
    const c = clima(ciudades[ciudadIdx].clave, fecha, idioma);
    const nota =
      d === 0
        ? t.llegada(ciudad)
        : d === totalDias - 1
          ? t.ultimo
          : traslados.at(-1)?.fecha === fecha
            ? t.trasladoNota(ciudad)
            : undefined;
    dias.push({ fecha, ciudad, clima: c, consejo: consejoClima(c, idioma), actividades: [], nota });
    nochesEnCiudad++;
  }

  ubicarActividades(dias, actividades, input.plan);

  const vuelos = armarVuelos(input, ciudades[0], ciudades[ciudades.length - 1], aerolineas, ahora, idioma);
  const vueloElegido = elegirPorPlan(
    input.plan === "equilibrado" ? vuelos.filter((v) => v.ida.escalas.length <= 1) : vuelos,
    (v) => v.precioPorPersona,
    input.plan,
  ).id;

  const hoteles: Record<string, OpcionHotel[]> = {};
  const hotelElegido: Record<string, string> = {};
  for (const c of ciudades) {
    hoteles[c.clave] = armarHoteles(input, c, ahora, idioma);
    hotelElegido[c.clave] = input.hotelPreferido.trim()
      ? hoteles[c.clave][0].id
      : elegirPorPlan(hoteles[c.clave], (h) => h.precioNoche, input.plan).id;
  }

  const costoMedio = ciudades.reduce((s, c) => s + c.costo, 0) / ciudades.length;

  return {
    input,
    idioma,
    generadoEn: ahora,
    ruta,
    rutaSugerida: res.tipo === "pais",
    vuelos,
    vueloElegido,
    hoteles,
    hotelElegido,
    actividades,
    dias,
    traslados,
    gastosDiarios: {
      comidaPorPersona: redondear(COSTO_COMIDA[input.plan] * costoMedio, 1),
      transportePorPersona: redondear(COSTO_TRANSPORTE[input.plan] * costoMedio, 1),
    },
  };
}

/** Rearma el mismo viaje en otro idioma conservando lo que la persona eligió y editó. */
export function traducirViaje(plan: TripPlan, idioma: Idioma): TripPlan {
  if (plan.idioma === idioma) return plan;
  const nuevo = generarViaje(plan.input, idioma);
  return {
    ...nuevo,
    vueloElegido: plan.vueloElegido,
    hotelElegido: { ...nuevo.hotelElegido, ...plan.hotelElegido },
    dias: nuevo.dias.map((d, i) => ({ ...d, actividades: plan.dias[i]?.actividades ?? d.actividades })),
  };
}

/** Viaje de muestra para la portada: 5 días en China, como en el pedido original. */
export function viajeDeMuestra(): TripInput {
  const ida = sumarDias(hoy(), 40);
  return {
    origen: "Buenos Aires",
    aeropuertoOrigen: "EZE",
    destino: "China",
    fechaIda: ida,
    fechaVuelta: sumarDias(ida, 5),
    viajeros: ["Pascual", "Lucía", "Martín"],
    presupuestoMin: 2500,
    presupuestoMax: 3800,
    modoPresupuesto: "persona",
    aerolinea: "",
    clase: "economica",
    tipoHotel: "4",
    hotelPreferido: "",
    plan: "equilibrado",
    equipaje: "valija",
  };
}
