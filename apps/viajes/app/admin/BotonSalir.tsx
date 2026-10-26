"use client";

import { useRouter } from "next/navigation";

export function BotonSalir() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/salir", { method: "POST" }).catch(() => {});
        router.refresh();
      }}
      className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      Cerrar sesión
    </button>
  );
}
