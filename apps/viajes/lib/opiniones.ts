import { ASUNTO_CATEGORIA, clasificarOpinion, type Categoria, type Prioridad } from "./clasificar-opinion";
import { alertarDueno } from "./correo/envio";
import { sql } from "./db";
import type { Idioma } from "./idioma";

// Opiniones (1 a 5 estrellas y un comentario opcional). Son privadas: solo las ve el dueño en el admin
// y le llega un email con cada una.

const ESQUEMA = `create table if not exists opiniones (
  id uuid primary key default gen_random_uuid(),
  pagina text not null,
  estrellas int not null check (estrellas between 1 and 5),
  comentario text not null default '',
  idioma text not null,
  creada timestamptz not null default now()
)`;
// Columnas del agente clasificador (se suman a la tabla si ya existía).
const COLUMNAS = `alter table opiniones add column if not exists categoria text, add column if not exists prioridad text`;

async function preparar() {
  await sql(ESQUEMA);
  await sql(COLUMNAS);
}

export interface Opinion {
  pagina: string;
  estrellas: number;
  comentario: string;
  idioma: Idioma;
  creada: string;
  categoria: Categoria;
  prioridad: Prioridad;
}

const ETIQUETA: Record<Categoria, string> = {
  problema: "Problema", mejora: "Sugerencia para mejorar", elogio: "Elogio", comentario: "Comentario", sin_texto: "Solo estrellas",
};

export async function guardarOpinion(o: Omit<Opinion, "creada" | "categoria" | "prioridad">) {
  await preparar();
  const { categoria, prioridad } = clasificarOpinion(o.comentario, o.estrellas);
  await sql(`insert into opiniones (pagina, estrellas, comentario, idioma, categoria, prioridad) values ($1, $2, $3, $4, $5, $6)`, [
    o.pagina, o.estrellas, o.comentario, o.idioma, categoria, prioridad,
  ]);
  const [{ n, promedio }] = await sql<{ n: number; promedio: number }>(`select count(*)::int as n, coalesce(avg(estrellas), 0)::float as promedio from opiniones`);
  await alertarDueno(
    `${ASUNTO_CATEGORIA[categoria]}: ${"★".repeat(o.estrellas)}${"☆".repeat(5 - o.estrellas)}`,
    `Tipo: ${ETIQUETA[categoria]} · Prioridad: ${prioridad}\n${"★".repeat(o.estrellas)}${"☆".repeat(5 - o.estrellas)} (${o.estrellas} de 5)\nPágina: ${o.pagina}\nIdioma: ${o.idioma === "es" ? "español" : "inglés"}\n\n${o.comentario || "(sin comentario)"}\n\nPromedio general: ${promedio.toFixed(1)} de 5 (${n} ${n === 1 ? "opinión" : "opiniones"}).\nTodas las opiniones están en https://rumbotraveling.com/admin`,
  );
}

const ORDEN_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

export async function resumenOpiniones() {
  await preparar();
  const [r] = await sql<{ n: number; promedio: number }>(`select count(*)::int as n, coalesce(avg(estrellas), 0)::float as promedio from opiniones`);
  const porEstrellas = await sql<{ estrellas: number; n: number }>(`select estrellas, count(*)::int as n from opiniones group by estrellas`);
  const filas = await sql<Opinion>(`select pagina, estrellas, comentario, idioma, creada, categoria, prioridad from opiniones order by creada desc limit 100`);
  // Las anteriores al clasificador se clasifican al leerlas. Primero lo urgente (problemas), después mejoras, después el resto.
  const ultimas = filas
    .map((o) => (o.categoria && o.prioridad ? o : { ...o, ...clasificarOpinion(o.comentario, o.estrellas) }))
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || +new Date(b.creada) - +new Date(a.creada));
  const porCategoria = ultimas.reduce<Partial<Record<Categoria, number>>>((acc, o) => ({ ...acc, [o.categoria]: (acc[o.categoria] ?? 0) + 1 }), {});
  return {
    total: r.n,
    promedio: r.promedio,
    porEstrellas: Object.fromEntries(porEstrellas.map((x) => [x.estrellas, x.n])) as Record<number, number>,
    porCategoria,
    ultimas,
  };
}
