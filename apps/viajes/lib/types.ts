import type { Idioma } from "./idioma";

export type Clase = "economica" | "premium" | "business";
export type TipoHotel = "hostel" | "3" | "4" | "5" | "depto" | "propio"; // propio: ya tienen dónde quedarse
export type Plan = "economico" | "equilibrado" | "premium";
export type Equipaje = "mano" | "valija";
export type ModoPresupuesto = "total" | "persona";

/** Respuestas del asistente. */
export interface TripInput {
  origen: string; // ciudad de salida
  aeropuertoOrigen: string; // código IATA del aeropuerto elegido ("" si no se conoce)
  destino: string; // ciudad o país
  aeropuertoDestino: string; // código IATA de llegada elegido ("" si es un país o no se conoce)
  ciudadesDestino: { ciudad: string; iata: string }[]; // si el destino es un país: sus ciudades principales
  fechaIda: string; // YYYY-MM-DD
  fechaVuelta: string; // YYYY-MM-DD
  viajeros: string[];
  presupuestoMin: number;
  presupuestoMax: number;
  modoPresupuesto: ModoPresupuesto;
  aerolinea: string; // "" = cualquiera
  clase: Clase;
  tipoHotel: TipoHotel;
  hotelPreferido: string;
  plan: Plan;
  equipaje: Equipaje;
}

/**
 * Estado de verificación de un dato. Regla de los verificadores:
 * si algo no se puede confirmar, no se inventa.
 */
export type Verificacion = "verificado" | "estimado" | "no_verificado";

export interface Origen {
  fuente: string;
  consultadoEn: string; // ISO
  estado: Verificacion;
}

export type Condicion = "soleado" | "parcial" | "nublado" | "lluvia" | "tormenta" | "nieve";

export interface ClimaDia {
  fecha: string;
  condicion: Condicion;
  maxima: number;
  minima: number;
  probLluvia: number; // 0-100
  confianza: "alta" | "media" | "baja";
  /** pronostico: de los agentes; historico: promedio de años anteriores; sin_datos: no se consiguió. Sin valor: datos de ejemplo. */
  tipo?: "pronostico" | "historico" | "sin_datos";
  origen: Origen;
}

export interface Tramo {
  desde: string;
  hasta: string;
  salida: string; // ISO
  llegada: string; // ISO
  escalas: string[];
  duracionMin: number;
  numeros?: string[]; // números de vuelo reales ("UX 42"); sin valor en los datos de ejemplo
  segmentos?: SegmentoVuelo[]; // cada vuelo del tramo (solo con vuelos reales)
}

/** Un vuelo concreto dentro de un tramo: número, horarios locales, duración, avión y la escala que sigue. */
export interface SegmentoVuelo {
  numero: string;
  aerolinea: string;
  desde: string;
  hasta: string;
  salida: string; // hora local del aeropuerto de salida, guardada como ISO
  llegada: string; // hora local del aeropuerto de llegada
  duracionMin: number;
  avion?: string;
  escalaMin?: number; // espera hasta el próximo vuelo (si hay)
}

export interface OpcionVuelo {
  id: string;
  aerolinea: string;
  clase: Clase;
  ida: Tramo;
  vuelta: Tramo;
  precioPorPersona: number;
  condiciones: {
    equipajeMano: string;
    valija: string;
    cambios: string;
    reembolso: string;
  };
  linkReserva: string;
  origen: Origen;
  /** true: no es un vuelo real sino una estimación por distancia (sin aerolínea, número ni horarios). */
  estimado?: boolean;
  precioEstimado?: boolean;
  sugeridas?: string[]; // vuelo estimado: aerolíneas con las que buscar la ruta (las principales de cada país) // horario y número de vuelo reales, pero el precio es estimado por distancia
}

export interface OpcionHotel {
  id: string;
  ciudad: string;
  nombre: string;
  tipo: TipoHotel;
  zona: string;
  precioNoche: number; // por habitación, sin impuestos
  impuestosPct: number;
  habitaciones: number;
  condiciones: {
    desayuno: string;
    cancelacion: string;
    checkIn: string;
    checkOut: string;
  };
  linkReserva: string;
  origen: Origen;
  propiedad?: string; // ficha real de Google Hotels, para vigilar precio y disponibilidad
}

export type TipoActividad = "imperdible" | "comida" | "experiencia";

export interface Actividad {
  id: string;
  ciudad: string;
  nombre: string;
  tipo: TipoActividad;
  aireLibre: boolean;
  precioPorPersona: number;
  horas: number;
}

export interface TramoCiudad {
  clave: string; // identificador estable de la ciudad (no cambia con el idioma)
  ciudad: string;
  dias: number;
  aeropuerto: string; // IATA, para pedir el clima de la ciudad
}

export interface Traslado {
  fecha: string;
  desde: string;
  hasta: string;
  medio: string;
  precioPorPersona: number;
  origen: Origen;
}

export interface DiaItinerario {
  fecha: string;
  ciudad: string;
  clave: string; // clave de la ciudad (ver TramoCiudad)
  clima: ClimaDia;
  consejo: string;
  actividades: string[]; // ids
  nota?: string;
}

export interface TripPlan {
  input: TripInput;
  idioma: Idioma;
  generadoEn: string;
  ruta: TramoCiudad[];
  rutaSugerida: boolean; // true si el usuario puso solo el país
  vuelos: OpcionVuelo[];
  vueloElegido: string;
  hoteles: Record<string, OpcionHotel[]>; // por clave de ciudad
  hotelElegido: Record<string, string>; // por clave de ciudad
  actividades: Actividad[];
  dias: DiaItinerario[];
  traslados: Traslado[];
  gastosDiarios: { comidaPorPersona: number; transportePorPersona: number };
  /** true cuando el clima ya vino de los agentes (y las actividades se acomodaron según ese clima). */
  climaReal?: boolean;
  /** true cuando los vuelos son reales (Google Flights) y no de ejemplo. */
  vuelosReales?: boolean;
  /** true cuando los hoteles son reales (Google Hotels) y no de ejemplo. */
  hotelesReales?: boolean;
}
