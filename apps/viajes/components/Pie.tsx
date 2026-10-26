import Link from "next/link";
import { LogoCompleto } from "./Logo";

export function Pie() {
  const anio = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-arena-200 bg-arena-100 dark:border-arena-800 dark:bg-arena-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="flex flex-col items-start gap-3">
          <LogoCompleto ancho={132} />
          <p className="max-w-[36ch] text-sm text-arena-600 dark:text-arena-400">
            Itinerario, vuelos, hoteles, clima y presupuesto de tu viaje en un solo lugar.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <ul className="grid gap-2 text-sm">
            <li>
              <Link href="/planificar" className="text-arena-700 hover:text-oliva-700 hover:underline dark:text-arena-300 dark:hover:text-oliva-300">
                Planificar viaje
              </Link>
            </li>
            <li>
              <Link href="/viaje?ejemplo=1" className="text-arena-700 hover:text-oliva-700 hover:underline dark:text-arena-300 dark:hover:text-oliva-300">
                Ver un ejemplo
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-arena-200 dark:border-arena-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-arena-600 dark:text-arena-400">© {anio} Rumbo Traveling. Todos los derechos reservados.</p>
          <p className="flex items-center gap-3 text-xs text-arena-600 dark:text-arena-400">
            Un proyecto de Pascual Pepa
            <Link
              href="/admin"
              prefetch={false}
              className="text-[11px] text-arena-400 hover:text-arena-600 hover:underline dark:text-arena-500 dark:hover:text-arena-300"
            >
              admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
