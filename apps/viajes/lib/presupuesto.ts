import { diferenciaDias } from "./fechas";
import { TEXTOS } from "./textos";
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
  for (const tramo of plan.ruta) res[tramo.clave] = (res[tramo.clave] ?? 0) + tramo.dias;
  return res;
}

/** Costo total de un hotel en una ciudad (por clave de ciudad), con impuestos. */
export function costoHotel(plan: TripPlan, clave: string, hotelId = plan.hotelElegido[clave]): number {
  const hotel = plan.hoteles[clave]?.find((h) => h.id === hotelId);
  if (!hotel) return 0;
  const noches = nochesPorCiudad(plan)[clave] ?? 0;
  return hotel.precioNoche * hotel.habitaciones * noches * (1 + hotel.impuestosPct / 100);
}

export function calcularResumen(plan: TripPlan): Resumen {
  const personas = Math.max(1, plan.input.viajeros.length);
  const dias = diferenciaDias(plan.input.fechaIda, plan.input.fechaVuelta) + 1;
  const lineas: LineaPresupuesto[] = [];
  const t = TEXTOS[plan.idioma ?? "es"].presupuesto.lineas;

  const vuelo = plan.vuelos.find((v) => v.id === plan.vueloElegido);
  // Un vuelo estimado sin distancia conocida no tiene precio: no se suma un cero engañoso.
  if (vuelo && !(vuelo.estimado && !vuelo.precioPorPersona)) {
    lineas.push({
      id: "vuelos",
      concepto: t.vuelos,
      detalle: t.vuelosDetalle(vuelo.aerolinea, personas),
      monto: vuelo.precioPorPersona * personas,
      estado: vuelo.origen.estado,
    });
  }

  for (const tramo of plan.ruta) {
    const hotel = plan.hoteles[tramo.clave]?.find((h) => h.id === plan.hotelElegido[tramo.clave]);
    if (!hotel) continue;
    lineas.push({
      id: `hotel-${tramo.clave}`,
      concepto: t.alojamiento(tramo.ciudad),
      detalle: t.alojamientoDetalle(hotel.nombre, tramo.dias),
      monto: costoHotel(plan, tramo.clave),
      estado: hotel.origen.estado,
    });
  }

  if (plan.traslados.length) {
    lineas.push({
      id: "traslados",
      concepto: t.traslados,
      detalle: plan.traslados.map((tr) => t.trasladoTramo(tr.desde, tr.hasta)).join(", "),
      monto: plan.traslados.reduce((s, tr) => s + tr.precioPorPersona, 0) * personas,
      estado: peor(plan.traslados.map((tr) => tr.origen.estado)),
    });
  }

  const elegidas = new Set(plan.dias.flatMap((d) => d.actividades));
  const actividades = plan.actividades.filter((a) => elegidas.has(a.id));
  lineas.push({
    id: "actividades",
    concepto: t.actividades,
    detalle: t.actividadesDetalle(actividades.length),
    monto: actividades.reduce((s, a) => s + a.precioPorPersona, 0) * personas,
    estado: "estimado",
  });

  lineas.push({
    id: "comida",
    concepto: t.comida,
    detalle: t.porDia(dias, plan.gastosDiarios.comidaPorPersona),
    monto: plan.gastosDiarios.comidaPorPersona * personas * dias,
    estado: "estimado",
  });
  lineas.push({
    id: "transporte",
    concepto: t.transporte,
    detalle: t.porDia(dias, plan.gastosDiarios.transportePorPersona),
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
