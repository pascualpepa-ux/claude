import { randomBytes, randomInt } from "node:crypto";
import { sql } from "./db";
import { emailsBloqueados } from "./bloqueados";

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
     from suscriptores s where s.estado = 'activo' and not (lower(s.email) = any($1::text[]))
     order by chances desc, s.confirmado asc`,
    [emailsBloqueados()],
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
  /** "elegido": lo eligió el dueño; "azar": sugerencia al azar. */
  modo: "elegido" | "azar";
  chances: number;
  participantes: number;
  totalChances: number;
  creado: string;
}

/** Hace el sorteo y lo deja registrado (con cuántos participaron) para poder mostrarlo después. */
export async function sortear(): Promise<ResultadoSorteo | null> {
  const lista = await participantes();
  const g = elegir(lista);
  return g ? anotar(g, lista, "azar") : null;
}

/** El dueño elige al ganador: tiene que ser un participante (suscriptor confirmado). */
export async function elegirGanador(email: string): Promise<ResultadoSorteo | null> {
  const lista = await participantes();
  const g = lista.find((p) => p.email === email.trim().toLowerCase());
  return g ? anotar(g, lista, "elegido") : null;
}

async function anotar(g: Participante, lista: Participante[], modo: ResultadoSorteo["modo"]): Promise<ResultadoSorteo> {
  const totalChances = lista.reduce((s, p) => s + p.chances, 0);
  const [r] = await sql<{ creado: string }>(
    `insert into sorteos (ganador, chances, participantes, total_chances, modo) values ($1, $2, $3, $4, $5) returning creado`,
    [g.email, g.chances, lista.length, totalChances, modo],
  );
  return { ganador: g.email, modo, chances: g.chances, participantes: lista.length, totalChances, creado: r.creado };
}

export async function sorteosHechos(): Promise<ResultadoSorteo[]> {
  return sql<ResultadoSorteo>(
    `select ganador, modo, chances, participantes, total_chances as "totalChances", creado from sorteos order by creado desc limit 20`,
  );
}
