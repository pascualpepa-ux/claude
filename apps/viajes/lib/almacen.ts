import type { TripPlan } from "./types";

// Claves de sessionStorage: lo que el usuario está armando en esta pestaña.
export const CLAVE_PEDIDO = "rumbo:pedido";
export const CLAVE_VIAJE = "rumbo:viaje";
export const CLAVE_BORRADOR = "rumbo:borrador";
/** Id del viaje guardado que se está mirando en esta pestaña (si es uno guardado). */
export const CLAVE_ABIERTO = "rumbo:abierto";

// Viajes guardados: van en localStorage, así quedan en este dispositivo y navegador y nadie más los ve.
// Las cuentas (para verlos en otros dispositivos) llegan en la fase 4.
const CLAVE_GUARDADOS = "rumbo:guardados";
const MAX_GUARDADOS = 20;

export interface ViajeGuardado {
  id: string;
  guardadoEl: string; // ISO
  plan: TripPlan;
  /** Respuestas del asistente, para que "Cambiar respuestas" vuelva con lo que había puesto. */
  borrador?: unknown;
}

export function leerGuardados(): ViajeGuardado[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_GUARDADOS) ?? "[]");
    return Array.isArray(lista) ? lista.filter((v) => v?.id && v?.plan?.input) : [];
  } catch {
    return [];
  }
}

function escribir(lista: ViajeGuardado[]) {
  try {
    localStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(lista));
    return true;
  } catch {
    return false; // navegación privada o sin espacio
  }
}

/** Guarda un viaje nuevo (o actualiza uno ya guardado). Devuelve el id, o null si el navegador no deja guardar. */
export function guardarViaje(plan: TripPlan, id?: string): string | null {
  const lista = leerGuardados();
  const previo = id ? lista.find((v) => v.id === id) : undefined;
  let borrador = previo?.borrador;
  try {
    borrador = JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) ?? "null") ?? borrador;
  } catch {}
  const nuevo: ViajeGuardado = {
    id: previo?.id ?? crypto.randomUUID(),
    guardadoEl: new Date().toISOString(),
    plan,
    borrador,
  };
  const resto = lista.filter((v) => v.id !== nuevo.id);
  return escribir([nuevo, ...resto].slice(0, MAX_GUARDADOS)) ? nuevo.id : null;
}

export function borrarGuardado(id: string) {
  escribir(leerGuardados().filter((v) => v.id !== id));
}

/** Deja un viaje guardado como el viaje actual de la pestaña, para abrirlo en /viaje. */
export function abrirGuardado(v: ViajeGuardado) {
  try {
    sessionStorage.setItem(CLAVE_PEDIDO, JSON.stringify(v.plan.input));
    sessionStorage.setItem(CLAVE_VIAJE, JSON.stringify(v.plan));
    sessionStorage.setItem(CLAVE_ABIERTO, v.id);
    if (v.borrador) sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(v.borrador));
    else sessionStorage.removeItem(CLAVE_BORRADOR);
  } catch {}
}
