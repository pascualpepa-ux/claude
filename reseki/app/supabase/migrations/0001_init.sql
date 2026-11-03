-- ════════════════════════════════════════════════════════════════════
--  Reseki — esquema inicial
--  Ejecutar una vez en Supabase → SQL Editor (o con `supabase db push`).
--
--  Seguridad: TODAS las tablas tienen Row Level Security activada.
--  Un usuario solo puede leer/editar las filas de SU restaurante.
--  Los tokens de Google no son legibles desde el navegador en ningún caso.
-- ════════════════════════════════════════════════════════════════════

-- ─── Tipos ───────────────────────────────────────────────────────────
create type public.reply_tone   as enum ('cercano', 'formal', 'divertido');
create type public.reply_status as enum ('pendiente', 'publicada', 'rechazada', 'error');
create type public.sub_status   as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');

-- ─── Utilidad: mantener updated_at al día ────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  restaurants — un restaurante por cuenta (una suscripción por local)
-- ════════════════════════════════════════════════════════════════════
create table public.restaurants (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null unique references auth.users (id) on delete cascade,
  owner_name               text not null default '',
  name                     text not null default '',

  -- Tono de las respuestas (onboarding / configuración)
  tone                     public.reply_tone not null default 'cercano',
  use_tu                   boolean not null default true,         -- true = tutear, false = de usted
  signature                text not null default '',
  extra_instructions       text not null default '' check (char_length(extra_instructions) <= 1000),

  -- Automatización y avisos
  auto_publish_positive    boolean not null default false,        -- 4–5★ se publican solas; 1–3★ nunca
  weekly_summary_email     boolean not null default true,
  negative_alert_email     boolean not null default true,

  -- Ficha de Google conectada (datos visibles; los tokens van en google_connections)
  google_location_name     text,                                  -- p. ej. "accounts/123/locations/456"
  google_location_title    text,
  google_location_address  text,
  google_connected_at      timestamptz,
  last_synced_at           timestamptz,

  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  google_connections — tokens OAuth de Google, CIFRADOS (AES-256-GCM
--  en el servidor antes de guardarlos). Sin políticas RLS = invisibles
--  para el navegador; solo el servidor con la clave de servicio los lee.
-- ════════════════════════════════════════════════════════════════════
create table public.google_connections (
  restaurant_id            uuid primary key references public.restaurants (id) on delete cascade,
  google_account_email     text,
  refresh_token_encrypted  text not null,
  access_token_encrypted   text,
  access_token_expires_at  timestamptz,
  scopes                   text[] not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger google_connections_touch before update on public.google_connections
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  reviews — reseñas traídas de Google (o de ejemplo en modo demo)
-- ════════════════════════════════════════════════════════════════════
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references public.restaurants (id) on delete cascade,
  google_review_id   text not null,                 -- id de Google (o "demo-…")
  author_name        text not null default 'Cliente de Google',
  author_photo_url   text,
  rating             smallint not null check (rating between 1 and 5),
  comment            text not null default '',      -- puede venir vacía (solo estrellas)
  language           text,                          -- código ISO 639-1 detectado: es, en, ca, fr…
  reviewed_at        timestamptz not null,          -- fecha de la reseña en Google
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (restaurant_id, google_review_id)
);
create index reviews_restaurant_date_idx on public.reviews (restaurant_id, reviewed_at desc);
create index reviews_restaurant_rating_idx on public.reviews (restaurant_id, rating);

-- ════════════════════════════════════════════════════════════════════
--  replies — respuesta sugerida por la IA y su ciclo de vida
-- ════════════════════════════════════════════════════════════════════
create table public.replies (
  id                       uuid primary key default gen_random_uuid(),
  review_id                uuid not null unique references public.reviews (id) on delete cascade,
  restaurant_id            uuid not null references public.restaurants (id) on delete cascade,
  suggested_text           text not null,           -- lo que escribió la IA
  final_text               text,                    -- lo que se publicó (editado o no)
  status                   public.reply_status not null default 'pendiente',
  edited_by_owner          boolean not null default false,
  published_automatically  boolean not null default false,
  ai_model                 text,
  error_message            text,
  published_at             timestamptz,
  rejected_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index replies_restaurant_status_idx on public.replies (restaurant_id, status);
create trigger replies_touch before update on public.replies
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  subscriptions — reflejo del estado en Stripe (lo escribe el webhook)
-- ════════════════════════════════════════════════════════════════════
create table public.subscriptions (
  restaurant_id            uuid primary key references public.restaurants (id) on delete cascade,
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  status                   public.sub_status,
  trial_ends_at            timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  Alta automática: al crear un usuario se crea su restaurante vacío
-- ════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.restaurants (owner_id, owner_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.restaurants        enable row level security;
alter table public.google_connections enable row level security;
alter table public.reviews            enable row level security;
alter table public.replies            enable row level security;
alter table public.subscriptions      enable row level security;

-- Ids de restaurante del usuario actual (security definer evita recursión de RLS).
create or replace function public.my_restaurant_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select id from public.restaurants where owner_id = (select auth.uid())
$$;

-- restaurants: el dueño lee y edita SOLO los ajustes; los campos de Google los escribe el servidor.
create policy "dueño lee su restaurante" on public.restaurants
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "dueño edita su restaurante" on public.restaurants
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

revoke update on public.restaurants from authenticated;
grant update (owner_name, name, tone, use_tu, signature, extra_instructions,
              auto_publish_positive, weekly_summary_email, negative_alert_email,
              onboarding_completed_at)
  on public.restaurants to authenticated;

-- google_connections: sin políticas → el navegador no puede leer ni escribir nada.

-- reviews: solo lectura para el dueño (las inserta el servidor al sincronizar).
create policy "dueño lee sus reseñas" on public.reviews
  for select to authenticated using (restaurant_id in (select public.my_restaurant_ids()));

-- replies: el dueño lee y puede editar el texto; publicar lo hace el servidor.
create policy "dueño lee sus respuestas" on public.replies
  for select to authenticated using (restaurant_id in (select public.my_restaurant_ids()));
create policy "dueño edita sus respuestas" on public.replies
  for update to authenticated
  using (restaurant_id in (select public.my_restaurant_ids()))
  with check (restaurant_id in (select public.my_restaurant_ids()));

revoke update on public.replies from authenticated;
grant update (final_text, edited_by_owner) on public.replies to authenticated;

-- subscriptions: solo lectura para el dueño (las escribe el webhook de Stripe).
create policy "dueño lee su suscripción" on public.subscriptions
  for select to authenticated using (restaurant_id in (select public.my_restaurant_ids()));
