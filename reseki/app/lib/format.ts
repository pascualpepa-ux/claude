/** Formatos de fecha y número en español. */
const H = 3600e3;
const D = 24 * H;

export function timeAgo(iso: string, now = Date.now()) {
  const d = now - new Date(iso).getTime();
  if (d < 60e3) return "ahora";
  if (d < H) return `hace ${Math.round(d / 60e3)} min`;
  if (d < D) return `hace ${Math.round(d / H)} h`;
  if (d < 7 * D) { const n = Math.round(d / D); return n === 1 ? "ayer" : `hace ${n} días`; }
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: d > 300 * D ? "numeric" : undefined });
}

export const decimal = (n: number, digits = 1) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function hoursLabel(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${decimal(hours)} h`;
  return `${Math.round(hours / 24)} días`;
}
