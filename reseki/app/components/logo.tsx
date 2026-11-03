import Link from "next/link";

/** Marca de Reseki: bocadillo de respuesta + nombre. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-fg">
      <span className="grid size-[22px] place-items-center rounded-[6px] bg-fg text-bg">
        <svg viewBox="0 0 24 24" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 18V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8l-4 3z" />
          <path d="M9 10h6" />
        </svg>
      </span>
      Reseki
    </Link>
  );
}
