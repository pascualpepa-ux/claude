import { resolverDestino, type CiudadBase } from "./destinos";
import { diferenciaDias, hoy, sumarDias } from "./fechas";
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

export const FUENTE_EJEMPLO = "Datos de ejemplo";

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

function origen(consultadoEn: string, estado: Origen["estado"] = "verificado"): Origen {
  return { fuente: FUENTE_EJEMPLO, consultadoEn, estado };
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

function clima(ciudad: string, fecha: string): ClimaDia {
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
    origen: origen(new Date().toISOString(), confianza === "baja" ? "estimado" : "verificado"),
  };
}

function consejoClima(c: ClimaDia): string {
  if (c.condicion === "tormenta") return "Día de tormenta: priorizá museos y lugares cubiertos.";
  if (c.condicion === "lluvia") return "Llevá paraguas. Dejamos para hoy los planes bajo techo.";
  if (c.maxima >= 29) return "Hace calor: hidratate y evitá el sol del mediodía.";
  if (c.maxima <= 8) return "Frío: abrigo, guantes y planes cortos al aire libre.";
  if (c.condicion === "soleado") return "Buen día para caminar y hacer planes al aire libre.";
  return "Clima templado: sirve tanto para paseos como para museos.";
}

function armarVuelos(input: TripInput, destino: CiudadBase, regreso: CiudadBase, aerolineas: string[], ahora: string): OpcionVuelo[] {
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
  const origenCodigo = input.origen.trim().slice(0, 3).toUpperCase() || "EZE";
  return perfiles.map((p, i) => {
    const aerolinea = lista[i % lista.length];
    const duracionIda = Math.round(entre(r, 14, 18) * 60 + p.escalas * entre(r, 120, 240));
    const duracionVuelta = Math.round(duracionIda + entre(r, -60, 60));
    const escalas = Array.from({ length: p.escalas }, (_, k) => escalasPosibles[(i * 2 + k) % escalasPosibles.length]);
    const salidaIda = new Date(`${input.fechaIda}T${["22:40", "13:15", "06:05"][i]}:00Z`);
    const salidaVuelta = new Date(`${input.fechaVuelta}T${["11:20", "18:45", "09:30"][i]}:00Z`);
    const recargoValija = input.equipaje === "valija" && !p.valijaIncluida ? 140 : 0;
    const precioPorPersona = redondear(base * p.factor) + recargoValija;
    const busqueda = `vuelos de ${input.origen} a ${destino.nombre} ${input.fechaIda} vuelta ${input.fechaVuelta} ${aerolinea}`;
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
        equipajeMano: "Incluye equipaje de mano de hasta 8 kg",
        valija: p.valijaIncluida
          ? "Incluye 1 valija de 23 kg"
          : input.equipaje === "valija"
            ? "Valija de 23 kg sumada al precio (US$ 140 ida y vuelta)"
            : "Valija no incluida (US$ 140 ida y vuelta si la agregás)",
        cambios: p.escalas === 2 ? "No permite cambios" : `Cambios con cargo de US$ ${p.escalas === 0 ? 100 : 180}`,
        reembolso: p.escalas === 0 ? "Reembolsable con penalidad del 20%" : "No reembolsable",
      },
      linkReserva: `https://www.google.com/travel/flights?hl=es&q=${encodeURIComponent(busqueda)}`,
      origen: origen(ahora, p.estado),
    };
  });
}

function nombresHotel(tipo: TipoHotel, zonas: string[]): string[] {
  const [z1, z2 = z1, z3 = z2] = zonas;
  switch (tipo) {
    case "hostel":
      return [`Hostel Casa ${z1}`, `${z2} Backpackers`, `Hostel del Puerto ${z3}`];
    case "depto":
      return [`Departamento luminoso en ${z1}`, `Loft con balcón en ${z2}`, `Departamento familiar en ${z3}`];
    default:
      return [`Hotel Jardín ${z1}`, `${z2} Suites`, `Gran Hotel ${z3}`];
  }
}

function habitacionesPara(tipo: TipoHotel, personas: number): number {
  if (tipo === "hostel") return personas; // camas
  if (tipo === "depto") return Math.ceil(personas / 4);
  return Math.ceil(personas / 2);
}

function armarHoteles(input: TripInput, ciudad: CiudadBase, ahora: string): OpcionHotel[] {
  const r = azar(`hoteles|${ciudad.nombre}|${input.tipoHotel}|${input.fechaIda}`);
  const nombres = nombresHotel(input.tipoHotel, ciudad.zonas);
  const preferido = input.hotelPreferido.trim();
  if (preferido) nombres[0] = preferido;
  const factores = [1.25, 1, 0.82];
  const habitaciones = habitacionesPara(input.tipoHotel, input.viajeros.length);
  return nombres.map((nombre, i) => {
    const esPreferido = preferido && i === 0;
    const precioNoche = redondear(PRECIO_HOTEL[input.tipoHotel] * ciudad.costo * factores[i] * entre(r, 0.9, 1.15));
    return {
      id: `${ciudad.nombre}-hotel-${i}`,
      ciudad: ciudad.nombre,
      nombre,
      tipo: input.tipoHotel,
      zona: ciudad.zonas[i % ciudad.zonas.length],
      precioNoche,
      impuestosPct: Math.round(entre(r, 8, 16)),
      habitaciones,
      condiciones: {
        desayuno: i === 2 ? "Desayuno no incluido" : "Desayuno incluido",
        cancelacion: i === 2 ? "No reembolsable" : `Cancelación gratis hasta ${i === 0 ? 72 : 48} h antes`,
        checkIn: i === 1 ? "Desde las 14:00" : "Desde las 15:00",
        checkOut: i === 0 ? "Hasta las 12:00" : "Hasta las 11:00",
      },
      linkReserva: `https://www.google.com/travel/search?hl=es&q=${encodeURIComponent(`${nombre} ${ciudad.nombre}`)}`,
      // Un hotel elegido por el usuario no se puede confirmar con datos de ejemplo.
      origen: origen(ahora, esPreferido ? "no_verificado" : i === 2 ? "estimado" : "verificado"),
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

export function generarViaje(input: TripInput): TripPlan {
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
  const ruta: TramoCiudad[] = ciudades.map((c, i) => ({ ciudad: c.nombre, dias: nochesPorCiudad[i] }));

  const actividades: Actividad[] = ciudades.flatMap((c) =>
    c.actividades.map((a, i) => ({
      id: `${c.nombre}-act-${i}`,
      ciudad: c.nombre,
      nombre: a.nombre,
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
      const desde = ciudades[ciudadIdx].nombre;
      ciudadIdx++;
      nochesEnCiudad = 0;
      traslados.push({
        fecha,
        desde,
        hasta: ciudades[ciudadIdx].nombre,
        medio: "Tren rápido",
        precioPorPersona: redondear(70 * ciudades[ciudadIdx].costo),
        origen: origen(ahora, "estimado"),
      });
    }
    const ciudad = ciudades[ciudadIdx].nombre;
    const c = clima(ciudad, fecha);
    const nota =
      d === 0
        ? `Llegada a ${ciudad}. Check-in y primera recorrida tranquila.`
        : d === totalDias - 1
          ? "Último día: check-out y traslado al aeropuerto."
          : traslados.at(-1)?.fecha === fecha
            ? `Traslado en tren a ${ciudad} por la mañana.`
            : undefined;
    dias.push({ fecha, ciudad, clima: c, consejo: consejoClima(c), actividades: [], nota });
    nochesEnCiudad++;
  }

  ubicarActividades(dias, actividades, input.plan);

  const vuelos = armarVuelos(input, ciudades[0], ciudades[ciudades.length - 1], aerolineas, ahora);
  const vueloElegido = elegirPorPlan(
    input.plan === "equilibrado" ? vuelos.filter((v) => v.ida.escalas.length <= 1) : vuelos,
    (v) => v.precioPorPersona,
    input.plan,
  ).id;

  const hoteles: Record<string, OpcionHotel[]> = {};
  const hotelElegido: Record<string, string> = {};
  for (const c of ciudades) {
    hoteles[c.nombre] = armarHoteles(input, c, ahora);
    hotelElegido[c.nombre] = input.hotelPreferido.trim()
      ? hoteles[c.nombre][0].id
      : elegirPorPlan(hoteles[c.nombre], (h) => h.precioNoche, input.plan).id;
  }

  const costoMedio = ciudades.reduce((s, c) => s + c.costo, 0) / ciudades.length;

  return {
    input,
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

/** Viaje de muestra para la portada: 5 días en China, como en el pedido original. */
export function viajeDeMuestra(): TripInput {
  const ida = sumarDias(hoy(), 40);
  return {
    origen: "Buenos Aires",
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
