import { createHash, randomBytes } from "node:crypto";
import { correoConfigurado, enviar } from "./correo/envio";
import { SITIO, correoConfirmacion, enlaceBaja } from "./correo/redactor";
import { dbConfigurada, sql } from "./db";
import type { Idioma } from "./idioma";
import type { TripPlan } from "./types";

export const HORAS_CONFIRMACION = 48;

export const suscripcionesActivas = () => dbConfigurada() && correoConfigurado();

const token = () => randomBytes(32).toString("base64url");
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export const emailValido = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

interface Suscriptor {
  id: string;
  email: string;
  idioma: Idioma;
  estado: "pendiente" | "activo" | "baja";
  token_baja: string;
}

/**
 * Pide la suscripción: guarda email + idioma (y el viaje, si vino desde un viaje) y manda el email de confirmación.
 * Siempre responde igual, para no revelar si un email ya estaba suscripto.
 */
export async function suscribir(emailCrudo: string, idioma: Idioma, plan: TripPlan | null): Promise<"ok" | "limite" | "error"> {
  const email = emailCrudo.trim().toLowerCase();
  const [s] = await sql<Suscriptor>(
    `insert into suscriptores (email, idioma, token_baja) values ($1, $2, $3)
     on conflict (email) do update set idioma = excluded.idioma,
       estado = case when suscriptores.estado = 'baja' then 'pendiente' else suscriptores.estado end
     returning id, email, idioma, estado, token_baja`,
    [email, idioma, token()],
  );
  // Máximo 3 emails de confirmación por hora a la misma dirección (evita usar la web para molestar a alguien).
  const [{ n }] = await sql<{ n: number }>(
    `select count(*)::int as n from confirmaciones where suscriptor_id = $1 and creada > now() - interval '1 hour'`,
    [s.id],
  );
  if (n >= 3) return "limite";

  let viajeId: string | null = null;
  if (plan) {
    const [v] = await sql<{ id: string }>(`insert into viajes_seguidos (suscriptor_id, plan) values ($1, $2) returning id`, [s.id, plan]);
    viajeId = v.id;
  }
  const t = token();
  await sql(
    `insert into confirmaciones (token_hash, suscriptor_id, viaje_id, vence) values ($1, $2, $3, now() + interval '${HORAS_CONFIRMACION} hours')`,
    [hash(t), s.id, viajeId],
  );
  const enlace = `${SITIO()}/suscripcion/confirmar?t=${t}`;
  const ok = await enviar({
    para: s.email,
    suscriptorId: s.id,
    tipo: "confirmacion",
    idiomaSuscriptor: idioma,
    correo: correoConfirmacion(idioma, enlace, s.token_baja),
    enlaceBaja: enlaceBaja(s.token_baja),
  });
  return ok ? "ok" : "error";
}

export type ResultadoConfirmacion = { estado: "ok" | "vencido" | "invalido"; idioma: Idioma | null };

/** Confirma con el token del email: activa la suscripción y el viaje que venía con ella. */
export async function confirmar(t: string): Promise<ResultadoConfirmacion> {
  const [c] = await sql<{ suscriptor_id: string; viaje_id: string | null; vencido: boolean; usada: string | null; idioma: Idioma }>(
    `select c.suscriptor_id, c.viaje_id, c.vence < now() as vencido, c.usada, s.idioma
     from confirmaciones c join suscriptores s on s.id = c.suscriptor_id where c.token_hash = $1`,
    [hash(t)],
  );
  if (!c) return { estado: "invalido", idioma: null };
  if (c.usada) return { estado: "ok", idioma: c.idioma }; // volver a apretar el botón no es un error
  if (c.vencido) return { estado: "vencido", idioma: c.idioma };
  await sql(`update confirmaciones set usada = now() where token_hash = $1`, [hash(t)]);
  await sql(`update suscriptores set estado = 'activo', confirmado = coalesce(confirmado, now()), dado_de_baja = null where id = $1`, [c.suscriptor_id]);
  if (c.viaje_id) await sql(`update viajes_seguidos set estado = 'activo' where id = $1`, [c.viaje_id]);
  return { estado: "ok", idioma: c.idioma };
}

/** Datos para la página de baja (no da de baja: eso pasa al apretar el botón). */
export async function suscriptorPorBaja(tokenBaja: string) {
  const [s] = await sql<Suscriptor>(`select id, email, idioma, estado, token_baja from suscriptores where token_baja = $1`, [tokenBaja]);
  return s ?? null;
}

export async function darDeBaja(tokenBaja: string): Promise<boolean> {
  const filas = await sql(
    `update suscriptores set estado = 'baja', dado_de_baja = now() where token_baja = $1 returning id`,
    [tokenBaja],
  );
  if (filas.length) await sql(`update viajes_seguidos set estado = 'terminado' where suscriptor_id = $1`, [(filas[0] as { id: string }).id]);
  return filas.length > 0;
}
