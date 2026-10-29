import { createHmac, timingSafeEqual } from "node:crypto";

// Sesión de administrador: una cookie firmada con HMAC, sin base de datos.
// La contraseña y el secreto viven en variables de entorno de Vercel, nunca en el código.

export const COOKIE_ADMIN = "rumbo_admin";
const DURACION_SEG = 60 * 60 * 12; // 12 horas

function secreto(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

function firmar(valor: string, clave: string) {
  return createHmac("sha256", clave).update(valor).digest("base64url");
}

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigurado() {
  return Boolean(process.env.ADMIN_PASSWORD && secreto());
}

export function contrasenaValida(intento: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  // Se comparan hashes para que la comparación no dependa del largo.
  const clave = secreto() ?? "";
  return iguales(firmar(intento, clave), firmar(real, clave));
}

export function crearSesion(): { valor: string; maxAge: number } {
  const vence = Math.floor(Date.now() / 1000) + DURACION_SEG;
  return { valor: `${vence}.${firmar(String(vence), secreto()!)}`, maxAge: DURACION_SEG };
}

export function sesionValida(valor: string | undefined) {
  const clave = secreto();
  if (!valor || !clave) return false;
  const [vence, firma] = valor.split(".");
  if (!vence || !firma || !iguales(firma, firmar(vence, clave))) return false;
  return Number(vence) > Date.now() / 1000;
}

// Dispositivo autorizado: el admin solo funciona en el dispositivo que abrió una vez el link secreto
// /api/admin/dispositivo?clave=... (la clave vive en ADMIN_DISPOSITIVO_CLAVE). Sin esa variable, no se exige.
export const COOKIE_DISPOSITIVO = "rumbo_dispositivo";
export const DURACION_DISPOSITIVO_SEG = 60 * 60 * 24 * 400; // lo máximo que guardan los navegadores

export const dispositivoExigido = () => Boolean(process.env.ADMIN_DISPOSITIVO_CLAVE);

export function claveDispositivoValida(intento: string) {
  const real = process.env.ADMIN_DISPOSITIVO_CLAVE;
  if (!real || !secreto()) return false;
  return iguales(firmar(intento, secreto()!), firmar(real, secreto()!));
}

/** Valor de la cookie del dispositivo: depende de la clave, así cambiar la clave saca a todos los dispositivos. */
export function valorDispositivo() {
  return firmar(`dispositivo:${process.env.ADMIN_DISPOSITIVO_CLAVE}`, secreto()!);
}

export function dispositivoValido(valor: string | undefined) {
  if (!dispositivoExigido()) return true;
  if (!valor || !secreto()) return false;
  return iguales(valor, valorDispositivo());
}
