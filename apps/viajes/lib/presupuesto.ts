import { diferenciaDias } from "./fechas";
import type { TripPlan, Verificacion } from "./types";

export interface LineaPresupuesto {
  id: string;
  concepto: string;
  detalle: string;
  monto: number;
  estado: Verificacion;
}

export interface Resumen {
  lineas: LineaPresupuesto[];
  total: number;
  porPersona: number;
  personas: number;
  /** Comparación contra el rango que eligió el usuario (total o por persona). */
  rango: { modo: "total" | "persona"; comparado: number; min: number; max: number; estado: "dentro" | "excedido" | "debajo"; diferencia: number };
}

function peor(estados: Verificacion[]): Verificacion {
  if (estados.includes("no_verificado")) return "no_verificado";
  if (estados.includes("estimado")) return "estimado";
  return "verificado";
}

export function nochesPorCiudad(plan: TripPlan): Record<string, number> {
  const res: Record<string, number> = {};
  for (const tramo of plan.ruta) res[tramo.ciudad] = (res[tramo.ciudad] ?? 0) + tramo.dias;
  return res;
}

export function costoHotel(plan: TripPlan, ciudad: string, hotelId = plan.hotelElegido[ciudad]): number {
  const hotel = plan.hoteles[ciudad]?.find((h) => h.id === hotelId);
  if (!hotel) return 0;
  const noches = nochesPorCiudad(plan)[ciudad] ?? 0;
  return hotel.precioNoche * hotel.habitaciones * noches * (1 + hotel.impuestosPct / 100);
}

export function calcularResumen(plan: TripPlan): Resumen {
  const personas = Math.max(1, plan.input.viajeros.length);
  const dias = diferenciaDias(plan.input.fechaIda, plan.input.fechaVuelta) + 1;
  const lineas: LineaPresupuesto[] = [];

  const vuelo = plan.vuelos.find((v) => v.id === plan.vueloElegido);
  if (vuelo) {
    lineas.push({
      id: "vuelos",
      concepto: "Vuelos",
      detalle: `${vuelo.aerolinea}, ${personas} ${personas === 1 ? "pasaje" : "pasajes"} ida y vuelta`,
      monto: vuelo.precioPorPersona * personas,
      estado: vuelo.origen.estado,
    });
  }

  for (const tramo of plan.ruta) {
    const hotel = plan.hoteles[tramo.ciudad]?.find((h) => h.id === plan.hotelElegido[tramo.ciudad]);
    if (!hotel) continue;
    lineas.push({
      id: `hotel-${tramo.ciudad}`,
      concepto: `Alojamiento en ${tramo.ciudad}`,
      detalle: `${hotel.nombre}, ${tramo.dias} ${tramo.dias === 1 ? "noche" : "noches"} con impuestos`,
      monto: costoHotel(plan, tramo.ciudad),
      estado: hotel.origen.estado,
    });
  }

  if (plan.traslados.length) {
    lineas.push({
      id: "traslados",
      concepto: "Traslados entre ciudades",
      detalle: plan.traslados.map((t) => `${t.desde} a ${t.hasta}`).join(", "),
      monto: plan.traslados.reduce((s, t) => s + t.precioPorPersona, 0) * personas,
      estado: peor(plan.traslados.map((t) => t.origen.estado)),
    });
  }

  const elegidas = new Set(plan.dias.flatMap((d) => d.actividades));
  const actividades = plan.actividades.filter((a) => elegidas.has(a.id));
  lineas.push({
    id: "actividades",
    concepto: "Actividades",
    detalle: `${actividades.length} ${actividades.length === 1 ? "actividad" : "actividades"} en el itinerario`,
    monto: actividades.reduce((s, a) => s + a.precioPorPersona, 0) * personas,
    estado: "estimado",
  });

  lineas.push({
    id: "comida",
    concepto: "Comida",
    detalle: `${dias} días, aprox. US$ ${plan.gastosDiarios.comidaPorPersona} por persona por día`,
    monto: plan.gastosDiarios.comidaPorPersona * personas * dias,
    estado: "estimado",
  });
  lineas.push({
    id: "transporte",
    concepto: "Transporte local",
    detalle: `${dias} días, aprox. US$ ${plan.gastosDiarios.transportePorPersona} por persona por día`,
    monto: plan.gastosDiarios.transportePorPersona * personas * dias,
    estado: "estimado",
  });

  const total = lineas.reduce((s, l) => s + l.monto, 0);
  const porPersona = total / personas;
  const { presupuestoMin: min, presupuestoMax: max, modoPresupuesto } = plan.input;
  const comparado = modoPresupuesto === "persona" ? porPersona : total;
  const estado = max > 0 && comparado > max ? "excedido" : min > 0 && comparado < min ? "debajo" : "dentro";
  const diferencia = estado === "excedido" ? comparado - max : estado === "debajo" ? min - comparado : 0;

  return { lineas, total, porPersona, personas, rango: { modo: modoPresupuesto, comparado, min, max, estado, diferencia } };
}
