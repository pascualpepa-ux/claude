"use client";

import { useRouter } from "next/navigation";
import { useIdioma } from "@/components/ProveedorIdioma";

export function BotonSalir() {
  const router = useRouter();
  const { t } = useIdioma();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/salir", { method: "POST" }).catch(() => {});
        router.refresh();
      }}
      className="rounded-xl border border-arena-300 px-4 py-2 text-sm font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
    >
      {t.admin.salir}
    </button>
  );
}
