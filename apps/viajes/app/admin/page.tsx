import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ArrowSquareOut, ChartBar } from "@phosphor-icons/react/dist/ssr";
import { GraficoVisitas } from "@/components/GraficoVisitas";
import { COOKIE_ADMIN, adminConfigurado, sesionValida } from "@/lib/admin";
import { visitasPorDia } from "@/lib/goatcounter";
import { FormularioAdmin } from "./FormularioAdmin";
import { BotonSalir } from "./BotonSalir";

export const metadata: Metadata = { title: "Administración · Rumbo Traveling", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  if (!adminConfigurado()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="mt-2 text-arena-600 dark:text-arena-400">El acceso de administrador todavía no está configurado.</p>
      </div>
    );
  }

  const sesion = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!sesionValida(sesion)) return <FormularioAdmin />;

  const visitas = await visitasPorDia(30);

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Administración</h1>
        <BotonSalir />
      </header>

      <section aria-labelledby="titulo-visitas" className="mt-8 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
        <h2 id="titulo-visitas" className="text-lg font-semibold">
          Visitantes por día
        </h2>

        {visitas.estado === "sin_configurar" && (
          <div className="mt-4 flex gap-3 rounded-xl bg-arena-50 p-4 text-sm text-arena-700 dark:bg-arena-800/60 dark:text-arena-300">
            <ChartBar size={24} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
            <p>
              Falta conectar GoatCounter. Cuando estén cargados el código del sitio y la clave de API, acá vas a ver cuánta
              gente entra a la web cada día.
            </p>
          </div>
        )}

        {visitas.estado === "error" && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
            {visitas.mensaje}
          </p>
        )}

        {visitas.estado === "ok" && (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              {[
                ["Últimos 30 días", visitas.total],
                ["Hoy", visitas.dias.at(-1)!.visitas],
                ["Promedio por día", Math.round(visitas.total / visitas.dias.length)],
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
              Ver más detalles en GoatCounter
              <ArrowSquareOut size={16} aria-hidden />
            </a>
          </>
        )}
      </section>
    </main>
  );
}
