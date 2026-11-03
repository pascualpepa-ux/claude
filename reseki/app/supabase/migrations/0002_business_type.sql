-- ════════════════════════════════════════════════════════════════════
--  Reseki — cualquier tipo de negocio (no solo restaurantes)
--  Ejecutar una vez en Supabase → SQL Editor, después de 0001_init.sql.
-- ════════════════════════════════════════════════════════════════════
alter table public.restaurants
  add column if not exists business_type text not null default 'restaurante'
  check (business_type in ('restaurante','cafeteria','tienda','belleza','alojamiento','salud','servicios','otro'));

comment on table public.restaurants is 'Un negocio por cuenta (restaurante, tienda, peluquería…). El nombre de la tabla es histórico.';

grant update (business_type) on public.restaurants to authenticated;
