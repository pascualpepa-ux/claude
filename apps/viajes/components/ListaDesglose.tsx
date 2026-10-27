/** Lista de "quién / desde dónde" con cantidad, porcentaje y una barra proporcional. */
export function ListaDesglose({
  titulo,
  items,
  vacio,
}: {
  titulo: string;
  items: { clave: string; nombre: string; visitas: number }[];
  vacio: string;
}) {
  const total = items.reduce((s, i) => s + i.visitas, 0);
  const max = Math.max(...items.map((i) => i.visitas), 1);
  return (
    <section className="rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      <h2 className="font-semibold">{titulo}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-arena-500 dark:text-arena-400">{vacio}</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {items.map((i) => (
            <li key={i.clave}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{i.nombre}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold">{i.visitas}</span>{" "}
                  <span className="text-arena-500 dark:text-arena-400">{Math.round((i.visitas / total) * 100)}%</span>
                </span>
              </div>
              <div
                className="mt-1 h-1.5 rounded-full bg-oliva-600 dark:bg-oliva-300"
                style={{ width: `${Math.max(2, (i.visitas / max) * 100)}%` }}
                aria-hidden
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
