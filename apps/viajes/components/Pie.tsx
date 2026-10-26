import Link from "next/link";

export function Pie() {
  return (
    <footer className="mt-auto border-t border-zinc-200 py-6 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Un proyecto de Pascual Pepa</p>
        <Link
          href="/admin"
          prefetch={false}
          className="mt-2 inline-block text-[11px] text-zinc-400 hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          admin
        </Link>
      </div>
    </footer>
  );
}
