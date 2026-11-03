# Reseki

SaaS que responde automáticamente las reseñas de Google de restaurantes con IA (Claude).
Un proyecto de Pascual Pepa.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · componentes estilo shadcn/ui · Supabase (base de datos, login, RLS) · Stripe · Google Business Profile API · Anthropic API · Resend · Vercel.

## Estructura

```
app/
  (auth)/            registro, login, recuperar y nueva contraseña + acciones de servidor
  auth/callback/     destino de los enlaces de Supabase (confirmar email, Google, recuperar)
  onboarding/        conectar Google + tono                (fase 2)
  panel/             reseñas, configuración, facturación   (fases 3–6)
components/          UI reutilizable (botones, campos, logo, tema)
lib/
  env.ts             variables de entorno centralizadas
  session.ts         usuario + restaurante actual (con RLS)
  supabase/          clientes de Supabase (navegador, servidor, middleware)
supabase/migrations/ esquema de la base de datos y reglas de seguridad
middleware.ts        refresca la sesión y protege /panel y /onboarding
```

## Fases

| # | Fase | Estado |
|---|------|--------|
| 1 | Base del proyecto y login | Hecha |
| 2 | Onboarding y tono | Hecha |
| 3 | Panel con modo demo | Hecha |
| 4 | Respuestas con IA | Hecha |
| 5 | Pagos con Stripe | Pendiente |
| 6 | Emails | Pendiente |
| 7 | Landing y páginas legales | Pendiente |
| 8 | Conexión real con Google | Pendiente |
| 9 | Deploy | Pendiente |

## Poner en marcha (fase 1)

1. Crea un proyecto en [supabase.com](https://supabase.com) (región **Europe – Frankfurt o París**, por el RGPD).
2. En Supabase → **SQL Editor**, pega y ejecuta el contenido de `supabase/migrations/0001_init.sql`.
3. En Supabase → **Authentication → URL Configuration**:
   - Site URL: la URL de la app (en local `http://localhost:3000`).
   - Redirect URLs: añade `http://localhost:3000/auth/callback` y la de producción `https://TU-DOMINIO/auth/callback`.
4. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API).
5. `npm install` y `npm run dev`. Abre http://localhost:3000.

### Login con Google (opcional en esta fase)

Supabase → Authentication → Providers → Google: necesita un Client ID y Secret de Google Cloud. Se configura junto con la conexión de Google Business Profile (fase 8).

## Cómo probar la fase 1

1. `/registro`: crea una cuenta. Llega un email de confirmación; al abrirlo entras en `/onboarding` y ves tu nombre.
2. `/panel` sin sesión te manda a `/login`.
3. Cierra sesión y vuelve a entrar en `/login`.
4. `/recuperar`: pide un enlace, ábrelo y elige una contraseña nueva.
5. En Supabase → Table Editor → `restaurants` aparece una fila nueva con tu nombre (la crea el trigger al registrarte).

## Cómo probar las fases 2–4

1. Añade `ANTHROPIC_API_KEY` (console.anthropic.com → API Keys) y `RESEKI_DEMO_MODE=true`. Sin clave, las respuestas salen de una plantilla de demostración.
2. Crea una cuenta: el onboarding pide el nombre del restaurante y crea una ficha de ejemplo con 10 reseñas en varios idiomas.
3. Paso 2: elige el tono y pulsa «Probar» para ver una respuesta real de la IA.
4. Paso 3: «Ir al panel». Las respuestas se generan en segundo plano y aparecen solas.
5. En el panel: aprueba, edita, rechaza, «Generar otra», filtros por estrellas y fecha, y «Buscar nuevas» (simula reseñas nuevas).
6. Activa «Publicar automáticamente 4 y 5 estrellas»: las pendientes de 4–5★ pasan a Respondidas.

## IA

- `lib/ai.ts`: Claude Opus 5.5 (`RESEKI_AI_MODEL` para cambiarlo), salida estructurada `{ language, reply }`, reintentos automáticos y modelo de reserva si un filtro de seguridad rechaza la petición.
- La reseña se pasa como datos entre etiquetas: las instrucciones escondidas dentro de una reseña se ignoran.
- Coste orientativo: alrededor de 1–2 céntimos por respuesta.

## Seguridad

- Todas las tablas tienen Row Level Security: cada restaurante solo ve sus propios datos.
- Los tokens de Google se guardan cifrados en `google_connections`, tabla sin acceso desde el navegador.
- Todas las claves van en variables de entorno; `.env*.local` está en `.gitignore`.
