import Link from "next/link";
import { Marca } from "./Logo";
import { Ayudante } from "./Ayudante";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-30 border-b border-arena-200/80 bg-arena-50/90 backdrop-blur dark:border-arena-800/80 dark:bg-arena-950/90">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Rumbo Traveling, ir al inicio">
          <Marca alto={34} prioridad />
          <span className="text-lg font-bold tracking-tight text-oliva-700 dark:text-arena-100">
            Rumbo <span className="hidden sm:inline">Traveling</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
        <Ayudante />
        <Link
          href="/planificar"
          className="shrink-0 rounded-xl bg-oliva-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
        >
          Planificar viaje
        </Link>
        </div>
      </nav>
    </header>
  );
}
