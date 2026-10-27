import type { Metadata } from "next";
import { textosActuales } from "@/lib/idioma-servidor";
import { cookies } from "next/headers";
import { ArrowSquareOut, ChartBar } from "@phosphor-icons/react/dist/ssr";
import { GraficoVisitas } from "@/components/GraficoVisitas";
import { COOKIE_ADMIN, adminConfigurado, sesionValida } from "@/lib/admin";
import { visitasPorDia } from "@/lib/goatcounter";
import { FormularioAdmin } from "./FormularioAdmin";
import { BotonSalir } from "./BotonSalir";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.admin, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

/** Promedio desde el primer día con visitas (así no lo bajan los días en que la web todavía no existía). */
function promedioDiario(dias: { visitas: number }[]) {
  const desde = dias.findIndex((d) => d.visitas > 0);
  if (desde < 0) return 0;
  const tramo = dias.slice(desde);
  const promedio = tramo.reduce((s, d) => s + d.visitas, 0) / tramo.length;
  return promedio >= 10 ? Math.round(promedio) : Math.round(promedio * 10) / 10;
}

export default async function Admin() {
  const { t } = await textosActuales();
  const A = t.admin;
  if (!adminConfigurado()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="text-2xl font-semibold tracking-tight">{A.titulo}</h1>
        <p className="mt-2 text-arena-600 dark:text-arena-400">{A.sinConfigurar}</p>
      </div>
    );
  }

  const sesion = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!sesionValida(sesion)) return <FormularioAdmin />;

  const visitas = await visitasPorDia(30);

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{A.titulo}</h1>
        <BotonSalir />
      </header>

      <section aria-labelledby="titulo-visitas" className="mt-8 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
        <h2 id="titulo-visitas" className="text-lg font-semibold">
          {A.visitantesDia}
        </h2>

        {visitas.estado === "sin_configurar" && (
          <div className="mt-4 flex gap-3 rounded-xl bg-arena-50 p-4 text-sm text-arena-700 dark:bg-arena-800/60 dark:text-arena-300">
            <ChartBar size={24} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
            <p>{A.faltaGoatcounter}</p>
          </div>
        )}

        {visitas.estado === "error" && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
            {visitas.motivo === "clave"
              ? A.errorClave
              : visitas.motivo === "servidor"
                ? A.errorServidor(visitas.status ?? 500)
                : A.errorConexion}
          </p>
        )}

        {visitas.estado === "ok" && (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              {[
                [A.ultimos30, visitas.total],
                [A.hoy, visitas.dias.at(-1)!.visitas],
                [A.promedio, promedioDiario(visitas.dias)],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <dt className="text-xs text-arena-600 sm:text-sm dark:text-arena-400">{etiqueta}</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{valor}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <GraficoVisitas dias={visitas.dias} />
            </div>
            <a
              href={visitas.panel}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300"
            >
              {A.verMas}
              <ArrowSquareOut size={16} aria-hidden />
            </a>
          </>
        )}
      </section>
    </main>
  );
}
