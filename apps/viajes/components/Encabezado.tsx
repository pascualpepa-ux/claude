import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export function Encabezado() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Compass size={24} weight="duotone" className="text-teal-700 dark:text-teal-400" aria-hidden />
          Rumbo
        </Link>
        <Link
          href="/planificar"
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.98] dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
        >
          Planificar viaje
        </Link>
      </nav>
    </header>
  );
}
