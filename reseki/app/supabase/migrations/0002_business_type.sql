-- ════════════════════════════════════════════════════════════════════
--  Reseki — cualquier tipo de negocio (no solo restaurantes)
--  Ejecutar una vez en Supabase → SQL Editor, después de 0001_init.sql.
-- ════════════════════════════════════════════════════════════════════
alter table public.restaurants
  add column if not exists business_type text not null default 'restaurante'
  check (business_type in ('restaurante','cafeteria','tienda','belleza','alojamiento','salud','servicios','otro'));

comment on table public.restaurants is 'Un negocio por cuenta (restaurante, tienda, peluquería…). El nombre de la tabla es histórico.';

grant update (business_type) on public.restaurants to authenticated;

-- ════════════════════════════════════════════════════════════════════
--  Aprender del estilo del dueño
--  - restaurants.learn_from_past: usar respuestas anteriores como ejemplo de estilo.
--  - replies.source: 'reseki' (generada aquí) o 'google' (el dueño ya había
--    respondido en Google antes de usar Reseki; se importa al sincronizar).
-- ════════════════════════════════════════════════════════════════════
alter table public.restaurants
  add column if not exists learn_from_past boolean not null default true;
grant update (learn_from_past) on public.restaurants to authenticated;

alter table public.replies
  add column if not exists source text not null default 'reseki'
  check (source in ('reseki', 'google'));
