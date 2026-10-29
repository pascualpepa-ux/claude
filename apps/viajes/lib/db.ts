import { Pool } from "pg";

// Base de datos Postgres (Neon en producción). Solo servidor.
// Las tablas se crean solas la primera vez que se usan.

const ESQUEMA = `
create table if not exists suscriptores (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  idioma text not null check (idioma in ('es', 'en')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'baja')),
  token_baja text not null,
  creado timestamptz not null default now(),
  confirmado timestamptz,
  dado_de_baja timestamptz
);
create table if not exists confirmaciones (
  token_hash text primary key,
  suscriptor_id uuid not null references suscriptores(id) on delete cascade,
  viaje_id uuid,
  vence timestamptz not null,
  usada timestamptz,
  creada timestamptz not null default now()
);
create table if not exists viajes_seguidos (
  id uuid primary key default gen_random_uuid(),
  suscriptor_id uuid not null references suscriptores(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'terminado')),
  plan jsonb not null,
  vigilancia jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  revisado timestamptz
);
create table if not exists envios (
  id uuid primary key default gen_random_uuid(),
  suscriptor_id uuid references suscriptores(id) on delete set null,
  para text not null,
  tipo text not null,
  idioma text not null,
  asunto text not null,
  html text not null,
  texto text not null,
  resend_id text,
  estado text not null default 'enviado',
  intentos int not null default 1,
  error text,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists envios_resend on envios (resend_id);
-- Sorteo: cada suscriptor tiene un código para invitar; quien se suscribe con ese link queda anotado.
alter table suscriptores add column if not exists codigo text unique;
alter table suscriptores add column if not exists invitado_por uuid references suscriptores(id) on delete set null;
create table if not exists sorteos (
  id uuid primary key default gen_random_uuid(),
  ganador text not null,
  chances int not null,
  participantes int not null,
  total_chances int not null,
  creado timestamptz not null default now()
);
alter table sorteos add column if not exists modo text not null default 'azar';
create table if not exists vigilancias (
  id int primary key,
  ultima timestamptz not null
);
`;

let pool: Pool | null = null;
let esquema: Promise<unknown> | null = null;

export const dbConfigurada = () => !!process.env.DATABASE_URL;

function obtenerPool() {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10_000 });
  return pool;
}

/** Consulta con parámetros ($1, $2...). Nunca se arma SQL concatenando datos de la gente. */
export async function sql<T = Record<string, unknown>>(texto: string, valores: unknown[] = []): Promise<T[]> {
  esquema ??= obtenerPool()
    .query(ESQUEMA)
    .catch((e) => {
      esquema = null;
      throw e;
    });
  await esquema;
  const r = await obtenerPool().query(texto, valores);
  return r.rows as T[];
}
