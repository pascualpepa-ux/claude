/**
 * Se vuelve a montar en cada navegación: transición suave entre páginas.
 * Sólo opacidad: una transformación rompería los elementos `fixed` (reproductor a pantalla completa).
 */
export default function Plantilla({ children }: { children: React.ReactNode }) {
  return <div className="animate-aparecer">{children}</div>;
}
