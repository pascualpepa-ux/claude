import { createHash, randomBytes } from "node:crypto";
import { alertarDueno, correoConfigurado, enviar } from "./correo/envio";
import { SITIO, correoConfirmacion, enlaceBaja } from "./correo/redactor";
import { dbConfigurada, sql } from "./db";
import type { Idioma } from "./idioma";
import type { TripPlan } from "./types";
import { chancesDe, codigoDe, sorteoActivo } from "./sorteo";

/** Con el sorteo activo, quien confirma recibe su link para invitar y ve cuántas chances tiene. */
async function datosSorteo(suscriptorId: string) {
  if (!sorteoActivo()) return undefined;
  return { codigo: await codigoDe(suscriptorId), chances: await chancesDe(suscriptorId) };
}

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
export async function suscribir(
  emailCrudo: string,
  idioma: Idioma,
  plan: TripPlan | null,
  ref: string | null = null,
): Promise<"ok" | "limite" | "error"> {
  const email = emailCrudo.trim().toLowerCase();
  // Quién lo invitó (sorteo) queda fijo la primera vez: volver a suscribirse con otro link no lo cambia.
  const [s] = await sql<Suscriptor>(
    `insert into suscriptores (email, idioma, token_baja, invitado_por)
       values ($1, $2, $3, (select id from suscriptores where codigo = $4 and email <> $1))
     on conflict (email) do update set idioma = excluded.idioma,
       estado = case when suscriptores.estado = 'baja' then 'pendiente' else suscriptores.estado end
     returning id, email, idioma, estado, token_baja`,
    [email, idioma, token(), ref],
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

export type ResultadoConfirmacion = { estado: "ok" | "vencido" | "invalido"; idioma: Idioma | null; sorteo?: { codigo: string; chances: number } };

/** Confirma con el token del email: activa la suscripción y el viaje que venía con ella. */
export async function confirmar(t: string): Promise<ResultadoConfirmacion> {
  const [c] = await sql<{ suscriptor_id: string; viaje_id: string | null; vencido: boolean; usada: string | null; idioma: Idioma }>(
    `select c.suscriptor_id, c.viaje_id, c.vence < now() as vencido, c.usada, s.idioma
     from confirmaciones c join suscriptores s on s.id = c.suscriptor_id where c.token_hash = $1`,
    [hash(t)],
  );
  if (!c) return { estado: "invalido", idioma: null };
  if (c.usada) return { estado: "ok", idioma: c.idioma, sorteo: await datosSorteo(c.suscriptor_id) }; // volver a apretar el botón no es un error
  if (c.vencido) return { estado: "vencido", idioma: c.idioma };
  await sql(`update confirmaciones set usada = now() where token_hash = $1`, [hash(t)]);
  await sql(`update suscriptores set estado = 'activo', confirmado = coalesce(confirmado, now()), dado_de_baja = null where id = $1`, [c.suscriptor_id]);
  if (c.viaje_id) await sql(`update viajes_seguidos set estado = 'activo' where id = $1`, [c.viaje_id]);
  await avisarAlDueno(c.suscriptor_id, "Nuevo suscriptor", c.viaje_id);
  return { estado: "ok", idioma: c.idioma, sorteo: await datosSorteo(c.suscriptor_id) };
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
  if (filas.length) {
    const id = (filas[0] as { id: string }).id;
    await sql(`update viajes_seguidos set estado = 'terminado' where suscriptor_id = $1`, [id]);
    await avisarAlDueno(id, "Se dio de baja");
  }
  return filas.length > 0;
}

/** Le escribe al dueño (desde info@) cuando alguien se suscribe o se da de baja. Si falla, no frena nada. */
async function avisarAlDueno(suscriptorId: string, que: string, viajeId?: string | null) {
  try {
    const [s] = await sql<{ email: string; idioma: Idioma; activos: number; viaje: string | null }>(
      `select s.email, s.idioma,
         (select count(*)::int from suscriptores where estado = 'activo') as activos,
         (select (plan->'input'->>'origen') || ' a ' || (plan->'input'->>'destino') || ', ' || (plan->'input'->>'fechaIda') || ' al ' || (plan->'input'->>'fechaVuelta')
            from viajes_seguidos where id = $2) as viaje
       from suscriptores s where s.id = $1`,
      [suscriptorId, viajeId ?? null],
    );
    if (!s) return;
    await alertarDueno(
      `${que}: ${s.email}`,
      `${que}: ${s.email}\nIdioma: ${s.idioma === "es" ? "español" : "inglés"}` +
        (s.viaje ? `\nViaje que sigue: ${s.viaje}` : "") +
        `\nSuscriptores activos ahora: ${s.activos}\n\nLa lista completa está en ${SITIO()}/admin`,
    );
  } catch (e) {
    console.error("aviso al dueño:", e);
  }
}

export interface FilaSuscriptor {
  email: string;
  idioma: Idioma;
  estado: "pendiente" | "activo" | "baja";
  creado: string;
  confirmado: string | null;
  viajes: string[];
  ultimo_envio: string | null;
  ultimo_estado: string | null;
}

/** Para el admin: todos los suscriptores, con sus viajes y cómo salió el último email. */
export async function listarSuscriptores(): Promise<FilaSuscriptor[]> {
  return sql<FilaSuscriptor>(
    `select s.email, s.idioma, s.estado, s.creado, s.confirmado,
       coalesce((select array_agg((v.plan->'input'->>'origen') || ' → ' || (v.plan->'input'->>'destino') || ' (' || (v.plan->'input'->>'fechaIda') || ')' order by v.creado)
                 from viajes_seguidos v where v.suscriptor_id = s.id and v.estado <> 'pendiente'), '{}') as viajes,
       e.creado as ultimo_envio, e.estado as ultimo_estado
     from suscriptores s
     left join lateral (select creado, estado from envios where suscriptor_id = s.id order by creado desc limit 1) e on true
     order by s.creado desc limit 500`,
  );
}
