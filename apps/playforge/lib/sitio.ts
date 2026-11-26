export const SITIO_URL =
  process.env.NEXT_PUBLIC_SITIO_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const NOMBRE_SITIO = "Playforge";
