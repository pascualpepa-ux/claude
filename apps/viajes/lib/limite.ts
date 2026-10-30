// Límite simple de pedidos por IP (por instancia del servidor), para que nadie abuse de una ruta.

const pedidos = new Map<string, number[]>();

export function permitido(clave: string, maximo: number, ventanaMs: number) {
  const ahora = Date.now();
  const recientes = (pedidos.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= maximo) return false;
  pedidos.set(clave, [...recientes, ahora]);
  return true;
}

export const ipDe = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
