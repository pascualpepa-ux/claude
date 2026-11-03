"use client";

import { CreditCard, Inbox, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", label: "Reseñas", icon: Inbox },
  { href: "/panel/configuracion", label: "Configuración", icon: SlidersHorizontal },
  { href: "/panel/facturacion", label: "Facturación", icon: CreditCard },
];

/** Navegación del panel. "horizontal" se usa en el móvil. */
export function PanelNav({ pending, horizontal = false }: { pending: number; horizontal?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className={cn("flex gap-px", horizontal ? "overflow-x-auto px-4 pb-2.5 [scrollbar-width:none]" : "flex-col")}>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/panel" ? path === "/panel" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 shrink-0 items-center gap-2.5 rounded-sm border border-transparent px-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg",
              active && "border-border bg-surface text-fg shadow-xs",
            )}
          >
            <Icon className="size-4" strokeWidth={1.6} />
            {label}
            {href === "/panel" && pending > 0 && <span className="ml-auto pl-2 font-mono text-[12px] text-fg-muted">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
