import { sql } from "./db";
import type { Idioma } from "./idioma";

// Mensajes de clientes: los del formulario de contacto y los emails que llegan al buzón de respuestas.
// Se guardan para verlos en el admin (son privados: solo los ve el dueño).

const ESQUEMA = `create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  nombre text not null default '',
  email text not null,
  asunto text not null default '',
  texto text not null,
  idioma text not null,
  respuesta_automatica boolean not null default false,
  creado timestamptz not null default now()
)`;

export interface Mensaje {
  origen: "formulario" | "email";
  nombre: string;
  email: string;
  asunto: string;
  texto: string;
  idioma: Idioma;
  respuesta_automatica: boolean;
  creado: string;
}

export async function guardarMensaje(m: Omit<Mensaje, "creado">) {
  await sql(ESQUEMA);
  await sql(
    `insert into mensajes (origen, nombre, email, asunto, texto, idioma, respuesta_automatica) values ($1, $2, $3, $4, $5, $6, $7)`,
    [m.origen, m.nombre, m.email, m.asunto, m.texto.slice(0, 4000), m.idioma, m.respuesta_automatica],
  );
}

export async function listarMensajes(limite = 50): Promise<Mensaje[]> {
  await sql(ESQUEMA);
  return sql<Mensaje>(
    `select origen, nombre, email, asunto, texto, idioma, respuesta_automatica, creado from mensajes order by creado desc limit $1`,
    [limite],
  );
}
