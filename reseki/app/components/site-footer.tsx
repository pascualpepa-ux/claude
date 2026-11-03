import Link from "next/link";
import { Logo } from "@/components/logo";

/** Pie de página común. Las páginas legales llegan en la fase de landing. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 text-[13px] text-fg-muted">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 sm:px-8">
        <div className="flex flex-col gap-1.5">
          <Logo />
          <span>Un proyecto de Pascual Pepa</span>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/privacidad" className="hover:text-fg">Privacidad</Link>
          <Link href="/terminos" className="hover:text-fg">Términos</Link>
          <Link href="/cookies" className="hover:text-fg">Cookies</Link>
        </nav>
        <span>© {new Date().getFullYear()} Reseki</span>
      </div>
    </footer>
  );
}
