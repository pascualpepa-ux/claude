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

export interface Opinion {
  pagina: string;
  estrellas: number;
  comentario: string;
  idioma: Idioma;
  creada: string;
}

export async function guardarOpinion(o: Omit<Opinion, "creada">) {
  await sql(ESQUEMA);
  await sql(`insert into opiniones (pagina, estrellas, comentario, idioma) values ($1, $2, $3, $4)`, [o.pagina, o.estrellas, o.comentario, o.idioma]);
  const [{ n, promedio }] = await sql<{ n: number; promedio: number }>(`select count(*)::int as n, coalesce(avg(estrellas), 0)::float as promedio from opiniones`);
  await alertarDueno(
    `Nueva opinión: ${"★".repeat(o.estrellas)}${"☆".repeat(5 - o.estrellas)}`,
    `${"★".repeat(o.estrellas)}${"☆".repeat(5 - o.estrellas)} (${o.estrellas} de 5)\nPágina: ${o.pagina}\nIdioma: ${o.idioma === "es" ? "español" : "inglés"}\n\n${o.comentario || "(sin comentario)"}\n\nPromedio general: ${promedio.toFixed(1)} de 5 (${n} ${n === 1 ? "opinión" : "opiniones"}).\nTodas las opiniones están en https://rumbotraveling.com/admin`,
  );
}

export async function resumenOpiniones() {
  await sql(ESQUEMA);
  const [r] = await sql<{ n: number; promedio: number }>(`select count(*)::int as n, coalesce(avg(estrellas), 0)::float as promedio from opiniones`);
  const porEstrellas = await sql<{ estrellas: number; n: number }>(`select estrellas, count(*)::int as n from opiniones group by estrellas`);
  const ultimas = await sql<Opinion>(`select pagina, estrellas, comentario, idioma, creada from opiniones order by creada desc limit 50`);
  return { total: r.n, promedio: r.promedio, porEstrellas: Object.fromEntries(porEstrellas.map((x) => [x.estrellas, x.n])) as Record<number, number>, ultimas };
}
