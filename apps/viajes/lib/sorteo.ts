import { randomBytes, randomInt } from "node:crypto";
import { sql } from "./db";

// Sorteo para suscriptores: participa cada suscriptor confirmado, con 1 chance
// más 1 por cada persona que se suscribió y confirmó con su link.
// Los datos del organizador y la fecha de cierre viven en variables de entorno.

export const sorteoActivo = () => process.env.SORTEO_ACTIVO === "1";

export const datosSorteo = () => ({
  /** Fecha de cierre (YYYY-MM-DD). */
  cierre: process.env.SORTEO_CIERRE || "",
  /** Nombre y documento de quien organiza (mayor de edad), como figuran en las bases. */
  organizador: process.env.SORTEO_ORGANIZADOR || "",
});

/** Código para invitar: se crea la primera vez que se pide. */
export async function codigoDe(suscriptorId: string): Promise<string> {
  const [s] = await sql<{ codigo: string }>(
    `update suscriptores set codigo = coalesce(codigo, $2) where id = $1 returning codigo`,
    [suscriptorId, randomBytes(6).toString("base64url")],
  );
  return s.codigo;
}

export async function chancesDe(suscriptorId: string): Promise<number> {
  const [r] = await sql<{ n: number }>(
    `select 1 + count(*)::int as n from suscriptores where invitado_por = $1 and estado = 'activo'`,
    [suscriptorId],
  );
  return r.n;
}

export interface Participante {
  email: string;
  invitados: number;
  chances: number;
}

export async function participantes(): Promise<Participante[]> {
  return sql<Participante>(
    `select s.email,
       (select count(*)::int from suscriptores i where i.invitado_por = s.id and i.estado = 'activo') as invitados,
       1 + (select count(*)::int from suscriptores i where i.invitado_por = s.id and i.estado = 'activo') as chances
     from suscriptores s where s.estado = 'activo'
     order by chances desc, s.confirmado asc`,
  );
}

/** Elige al azar respetando las chances de cada uno (más invitados, más chances). */
export function elegir<T extends { chances: number }>(lista: T[], azar: (max: number) => number = randomInt): T | null {
  const total = lista.reduce((s, p) => s + p.chances, 0);
  if (!total) return null;
  let tiro = azar(total);
  for (const p of lista) {
    if (tiro < p.chances) return p;
    tiro -= p.chances;
  }
  return null;
}

export interface ResultadoSorteo {
  ganador: string;
  chances: number;
  participantes: number;
  totalChances: number;
  creado: string;
}

/** Hace el sorteo y lo deja registrado (con cuántos participaron) para poder mostrarlo después. */
export async function sortear(): Promise<ResultadoSorteo | null> {
  const lista = await participantes();
  const g = elegir(lista);
  if (!g) return null;
  const totalChances = lista.reduce((s, p) => s + p.chances, 0);
  const [r] = await sql<{ creado: string }>(
    `insert into sorteos (ganador, chances, participantes, total_chances) values ($1, $2, $3, $4) returning creado`,
    [g.email, g.chances, lista.length, totalChances],
  );
  return { ganador: g.email, chances: g.chances, participantes: lista.length, totalChances, creado: r.creado };
}

export async function sorteosHechos(): Promise<ResultadoSorteo[]> {
  return sql<ResultadoSorteo>(
    `select ganador, chances, participantes, total_chances as "totalChances", creado from sorteos order by creado desc limit 20`,
  );
}
