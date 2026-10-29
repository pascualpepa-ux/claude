import Link from "next/link";
import { ArrowRight, ChatCircleText, MagicWand, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import type { Idioma } from "@/lib/idioma";
import { PORTADA } from "@/lib/textos-portada";

const ICONOS = [ChatCircleText, MagicWand, PaperPlaneTilt];

export function ComoFunciona({ idioma }: { idioma: Idioma }) {
  const P = PORTADA[idioma];
  return (
    <section aria-labelledby="titulo-como" className="bg-oliva-800 py-16 text-arena-50 md:py-24 dark:bg-oliva-900">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="titulo-como" className="max-w-[20ch] text-3xl font-semibold tracking-tight md:text-4xl">{P.comoTitulo}</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {P.pasos.map((p, i) => {
            const Icono = ICONOS[i];
            return (
              <li key={p.titulo} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                <span className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-amber-200 text-oliva-900">
                    <Icono size={26} weight="duotone" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-oliva-200">0{i + 1}</span>
                </span>
                <h3 className="mt-5 text-xl font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-arena-200">{p.texto}</p>
              </li>
            );
          })}
        </ol>
        <Link
          href="/planificar"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-arena-50 px-6 py-3 text-lg font-semibold text-oliva-800 transition hover:bg-white active:scale-[0.98]"
        >
          {P.empezar}
          <ArrowRight size={20} weight="bold" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
