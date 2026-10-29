import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartelSorteo } from "@/components/Sorteo";
import { FormularioSuscripcion } from "@/components/FormularioSuscripcion";
import { textosActuales } from "@/lib/idioma-servidor";
import { datosSorteo, sorteoActivo } from "@/lib/sorteo";
import { suscripcionesActivas } from "@/lib/suscripciones";
import { SORTEO } from "@/lib/textos-sorteo";
import { LOCALE } from "@/lib/idioma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { idioma } = await textosActuales();
  const S = SORTEO[idioma];
  return { title: `${S.titulo} | Rumbo Traveling`, description: `${S.premio}. ${S.bajada}`, robots: { index: false, follow: true } };
}

export default async function PaginaSorteo({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  if (!sorteoActivo()) notFound();
  const { idioma } = await textosActuales();
  const S = SORTEO[idioma];
  const { ref } = await searchParams;
  const codigo = ref && /^[\w-]{1,20}$/.test(ref) ? ref : undefined;
  const { cierre } = datosSorteo();
  const fecha = cierre ? new Date(`${cierre}T12:00:00`).toLocaleDateString(LOCALE[idioma], { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <CartelSorteo idioma={idioma} conBoton={false} />
      <section aria-label={S.participar} className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          {codigo && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{S.invitado}</p>}
          <h1 className="text-2xl font-semibold tracking-tight">{S.participar}</h1>
          <div className="mt-3">
            <FormularioSuscripcion sinTitulo activo={suscripcionesActivas()} codigoSorteo={codigo} />
          </div>
          <p className="mt-4 text-sm text-arena-600 dark:text-arena-400">
            {fecha && `${S.cierre(fecha)} `}
            <Link href="/sorteo/bases" className="underline underline-offset-2 hover:text-arena-900 dark:hover:text-arena-100">
              {S.bases}
            </Link>
          </p>
        </div>
        <ol className="grid gap-3">
          {S.pasos.map((p, i) => (
            <li key={p.titulo} className="flex gap-4 rounded-2xl border border-arena-200 bg-papel p-4 dark:border-arena-800 dark:bg-arena-900">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-oliva-700 font-bold text-white dark:bg-oliva-300 dark:text-arena-950">{i + 1}</span>
              <span>
                <span className="block font-semibold">{p.titulo}</span>
                <span className="block text-sm text-arena-600 dark:text-arena-400">{p.texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
