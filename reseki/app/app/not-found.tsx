import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-muted">Error 404</p>
        <h1 className="text-2xl font-semibold">Esta página no existe</h1>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>Volver al inicio</Link>
      </div>
    </main>
  );
}
