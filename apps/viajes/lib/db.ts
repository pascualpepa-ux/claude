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
-- Pasajes vendidos en la web (Duffel). "prueba" marca los del modo de prueba.
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  orden text not null,
  email text not null,
  ruta text not null,
  precio numeric not null,
  costo numeric not null,
  moneda text not null,
  prueba boolean not null,
  creado timestamptz not null default now()
);
-- Agentes de reservas: cada compra queda anotada antes de pagar, así el vigilante no se olvida de ninguna.
alter table reservas alter column codigo drop not null;
alter table reservas alter column orden drop not null;
alter table reservas add column if not exists estado text not null default 'emitida';
alter table reservas add column if not exists oferta_id text;
alter table reservas add column if not exists pasajeros jsonb;
alter table reservas add column if not exists intentos int not null default 0;
alter table reservas add column if not exists error text;
alter table reservas add column if not exists avisado boolean not null default false;
alter table reservas add column if not exists actualizado timestamptz not null default now();
alter table reservas add column if not exists tipo text not null default 'vuelo';
alter table reservas add column if not exists detalle jsonb;
alter table reservas add column if not exists token_cancelar text;
alter table reservas add column if not exists cancelada timestamptz;
alter table reservas add column if not exists novedades boolean not null default true;
-- Pago con tarjeta (Stripe): se retiene al pagar, se cobra cuando la compra sale, se libera si falla.
alter table reservas add column if not exists pago_id text;
alter table reservas add column if not exists pago_estado text;
create table if not exists vigilancias (
  id int primary key,
  ultima timestamptz not null
);
-- Cuentas de usuario (Rumbo Premium): login simple, sin terceros. La contraseña nunca se guarda en texto plano.
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  contrasena_hash text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  premium_estado text not null default 'inactivo' check (premium_estado in ('inactivo', 'activo', 'cancelado', 'pago_fallido')),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
-- Viajes guardados de verdad (para cuentas Premium) — a diferencia de los que se guardan solo en el navegador.
create table if not exists viajes_guardados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  nombre text not null,
  datos jsonb not null,
  creado timestamptz not null default now()
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
