import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql, dbConfigurada } from "./db";

// Cuentas de usuario para Rumbo Premium: login simple con email + contraseña, sin terceros.
// Mismo patrón que la sesión de admin (cookie firmada con HMAC), pero con su propio secreto
// (SESSION_SECRET) para que una cuenta de usuario nunca pueda falsificar una sesión de admin ni viceversa.

export const COOKIE_USUARIO = "rumbo_usuario";
const DURACION_SEG = 60 * 60 * 24 * 30; // 30 días

export interface Usuario {
  id: string;
  email: string;
  premium_estado: "inactivo" | "activo" | "cancelado" | "pago_fallido";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

function secreto(): string | null {
  return process.env.SESSION_SECRET || null;
}

export const cuentasConfiguradas = () => Boolean(secreto());

function firmar(valor: string, clave: string) {
  return createHmac("sha256", clave).update(valor).digest("base64url");
}

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Hash de contraseña con scrypt (nativo de Node, sin dependencias nuevas). Formato: "salt:hash", ambos en hex. */
export function hashContrasena(contrasena: string): string {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(contrasena, sal, 64).toString("hex");
  return `${sal}:${hash}`;
}

export function contrasenaCoincide(contrasena: string, hashGuardado: string): boolean {
  const [sal, hash] = hashGuardado.split(":");
  if (!sal || !hash) return false;
  const calculado = scryptSync(contrasena, sal, 64).toString("hex");
  return iguales(calculado, hash);
}

export function crearCookieSesion(usuarioId: string): { valor: string; maxAge: number } {
  const clave = secreto();
  if (!clave) throw new Error("SESSION_SECRET no configurado");
  const vence = Math.floor(Date.now() / 1000) + DURACION_SEG;
  const payload = `${usuarioId}.${vence}`;
  return { valor: `${payload}.${firmar(payload, clave)}`, maxAge: DURACION_SEG };
}

/** Devuelve el id del usuario si la cookie es válida y no venció, o null. */
export function usuarioIdDeCookie(valor: string | undefined): string | null {
  const clave = secreto();
  if (!valor || !clave) return null;
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  const [usuarioId, vence, firma] = partes;
  const payload = `${usuarioId}.${vence}`;
  if (!iguales(firma, firmar(payload, clave))) return null;
  if (Number(vence) <= Date.now() / 1000) return null;
  return usuarioId;
}

export async function usuarioPorEmail(email: string): Promise<(Usuario & { contrasena_hash: string }) | null> {
  const [fila] = await sql<Usuario & { contrasena_hash: string }>(
    "select id, email, contrasena_hash, premium_estado, stripe_customer_id, stripe_subscription_id from usuarios where email = $1",
    [email.trim().toLowerCase()],
  );
  return fila ?? null;
}

export async function usuarioPorId(id: string): Promise<Usuario | null> {
  const [fila] = await sql<Usuario>(
    "select id, email, premium_estado, stripe_customer_id, stripe_subscription_id from usuarios where id = $1",
    [id],
  );
  return fila ?? null;
}

export async function crearUsuario(email: string, contrasena: string): Promise<Usuario> {
  const [fila] = await sql<Usuario>(
    `insert into usuarios (email, contrasena_hash)
     values ($1, $2)
     returning id, email, premium_estado, stripe_customer_id, stripe_subscription_id`,
    [email.trim().toLowerCase(), hashContrasena(contrasena)],
  );
  return fila;
}

export const esPremium = (u: Pick<Usuario, "premium_estado">) => u.premium_estado === "activo";

/** Guarda el id de cliente de Stripe la primera vez que una cuenta arranca el checkout de Premium. */
export async function guardarClienteStripe(usuarioId: string, customerId: string): Promise<void> {
  await sql("update usuarios set stripe_customer_id = $1, actualizado = now() where id = $2", [customerId, usuarioId]);
}

/** Actualiza el estado Premium de la cuenta dueña de un cliente de Stripe (lo llama el webhook de suscripciones). */
export async function actualizarPremiumPorCliente(customerId: string, estado: Usuario["premium_estado"], subscriptionId: string | null): Promise<void> {
  await sql(
    "update usuarios set premium_estado = $1, stripe_subscription_id = $2, actualizado = now() where stripe_customer_id = $3",
    [estado, subscriptionId, customerId],
  );
}

/** El usuario con sesión iniciada en esta visita (según la cookie), o null. Solo servidor. */
export async function usuarioDeSesion(): Promise<Usuario | null> {
  if (!dbConfigurada() || !cuentasConfiguradas()) return null;
  const usuarioId = usuarioIdDeCookie((await cookies()).get(COOKIE_USUARIO)?.value);
  if (!usuarioId) return null;
  return usuarioPorId(usuarioId).catch(() => null);
}
