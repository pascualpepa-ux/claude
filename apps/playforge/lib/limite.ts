import "server-only";

/** Límite simple por IP en memoria (por instancia). */
const usos = new Map<string, { n: number; reinicio: number }>();

export function permitir(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const u = usos.get(clave);
  if (!u || u.reinicio < ahora) { usos.set(clave, { n: 1, reinicio: ahora + ventanaMs }); return true; }
  if (u.n >= maximo) return false;
  u.n++;
  return true;
}

export function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
