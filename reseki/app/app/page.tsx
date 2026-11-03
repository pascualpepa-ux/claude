import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

/** Portada provisional. La landing completa (beneficios, precio, FAQ) llega en la fase 7. */
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-15 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Iniciar sesión</Link>
            <Link href="/registro" className={buttonVariants()}>Prueba gratis</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-20 sm:px-8">
        <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-muted">Para restaurantes, tiendas y negocios locales</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(36px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.035em]">
          Cada reseña de Google, respondida.
        </h1>
        <p className="mt-5 max-w-[34em] text-lg text-fg-muted">
          Reseki prepara una respuesta en tu tono y en el idioma del cliente. Tú la apruebas con un clic.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/registro" className={buttonVariants({ size: "lg" })}>Empezar prueba de 30 días</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
