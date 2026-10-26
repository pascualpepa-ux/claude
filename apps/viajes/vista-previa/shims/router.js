// Navegación en memoria: el visor de artifacts no permite rutas propias en la URL.
import { useSyncExternalStore } from "react";

let actual = { path: "/", query: "" };
const oyentes = new Set();

export function navegar(href) {
  const [path, query = ""] = href.split("?");
  actual = { path: path || "/", query };
  oyentes.forEach((f) => f());
  window.scrollTo({ top: 0 });
}

export function useRuta() {
  return useSyncExternalStore(
    (f) => (oyentes.add(f), () => oyentes.delete(f)),
    () => actual,
  );
}
