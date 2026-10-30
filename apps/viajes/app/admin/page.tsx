import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowSquareOut, ChartBar } from "@phosphor-icons/react/dist/ssr";
import { GraficoVisitas, type Punto } from "@/components/GraficoVisitas";
import { ListaDesglose } from "@/components/ListaDesglose";
import { ListaSuscriptores } from "@/components/ListaSuscriptores";
import { ListaOpiniones } from "@/components/ListaOpiniones";
import { ListaMensajes } from "@/components/ListaMensajes";
import { listarMensajes } from "@/lib/mensajes";
import { resumenOpiniones } from "@/lib/opiniones";
import { dbConfigurada } from "@/lib/db";
import { listarSuscriptores, type FilaSuscriptor } from "@/lib/suscripciones";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, adminConfigurado, dispositivoValido, sesionValida } from "@/lib/admin";
import { notFound } from "next/navigation";
import { formatoCorto } from "@/lib/fechas";
import { estadisticas, type VisitasDia } from "@/lib/goatcounter";
import { LOCALE } from "@/lib/idioma";
import { textosActuales } from "@/lib/idioma-servidor";
import { FormularioAdmin } from "./FormularioAdmin";
import { BotonSalir } from "./BotonSalir";
import { PanelSorteo } from "./PanelSorteo";
import { PanelGanancias } from "./PanelGanancias";
import { ganancias } from "@/lib/ganancias";
import { modoPrueba, duffelConfigurado } from "@/lib/duffel";
import { hotelesConfigurado, hotelesPrueba } from "@/lib/hoteles";
import { participantes, sorteoActivo, sorteosHechos } from "@/lib/sorteo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await textosActuales();
  return { title: t.meta.admin, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

const PERIODOS = [7, 30, 90] as const;

/** Promedio desde el primer día con visitas (así no lo bajan los días en que la web todavía no existía). */
function promedioDiario(dias: VisitasDia[]) {
  const desde = dias.findIndex((d) => d.visitas > 0);
  if (desde < 0) return 0;
  const tramo = dias.slice(desde);
  const promedio = tramo.reduce((s, d) => s + d.visitas, 0) / tramo.length;
  return promedio >= 10 ? Math.round(promedio) : Math.round(promedio * 10) / 10;
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { idioma, t } = await textosActuales();
  const A = t.admin;
  if (!adminConfigurado()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="text-2xl font-semibold tracking-tight">{A.titulo}</h1>
        <p className="mt-2 text-arena-600 dark:text-arena-400">{A.sinConfigurar}</p>
      </div>
    );
  }

  const galletas = await cookies();
  // En un dispositivo que no es el del dueño (si se exige uno), el admin no existe.
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value)) notFound();
  const sesion = galletas.get(COOKIE_ADMIN)?.value;
  if (!sesionValida(sesion)) return <FormularioAdmin />;

  const pedido = Number((await searchParams).dias);
  const periodo = PERIODOS.find((p) => p === pedido) ?? 30;
  // Ganancias: si las ventas reales ya empezaron se muestran esas; si no, las de prueba (marcadas).
  const ventas = (duffelConfigurado() || hotelesConfigurado()) && dbConfigurada();
  const enPrueba = (!duffelConfigurado() || modoPrueba()) && (!hotelesConfigurado() || hotelesPrueba());
  const plata = ventas ? await ganancias(enPrueba).catch(() => null) : null;
  const sorteo =
    sorteoActivo() && dbConfigurada()
      ? await Promise.all([participantes(), sorteosHechos()])
          .then(([lista, hechos]) => ({ lista, hechos }))
          .catch(() => null)
      : null;
  const [datos, suscriptores, opiniones, mensajes] = await Promise.all([
    estadisticas(periodo),
    dbConfigurada()
      ? listarSuscriptores()
          .then((filas) => ({ estado: "ok" as const, filas }))
          .catch((e) => {
            console.error("admin suscriptores:", e);
            return { estado: "error" as const, filas: [] as FilaSuscriptor[] };
          })
      : Promise.resolve({ estado: "sin_base" as const, filas: [] as FilaSuscriptor[] }),
    dbConfigurada() ? resumenOpiniones().catch(() => null) : Promise.resolve(null),
    dbConfigurada() ? listarMensajes().catch(() => null) : Promise.resolve(null),
  ]);

  const paisNombre = (codigo: string) => {
    try {
      return new Intl.DisplayNames([LOCALE[idioma]], { type: "region" }).of(codigo) ?? codigo;
    } catch {
      return codigo;
    }
  };
  const horaEtiqueta = (h: number) => (idioma === "es" ? `${String(h).padStart(2, "0")}:00` : `${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{A.titulo}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label={A.periodo} className="inline-flex rounded-xl border border-arena-300 p-0.5 text-sm dark:border-arena-700">
            {PERIODOS.map((p) => (
              <Link
                key={p}
                href={`/admin?dias=${p}`}
                aria-current={p === periodo ? "page" : undefined}
                className={`rounded-[10px] px-3 py-1.5 font-medium transition ${
                  p === periodo
                    ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
                    : "text-arena-600 hover:text-oliva-700 dark:text-arena-400 dark:hover:text-oliva-300"
                }`}
              >
                {A.dias(p)}
              </Link>
            ))}
          </nav>
          <BotonSalir />
        </div>
      </header>

      {plata && <PanelGanancias idioma={idioma} datos={plata} prueba={enPrueba} banco={process.env.CUENTA_BANCARIA_VISIBLE ?? null} />}
      {sorteo && <PanelSorteo idioma={idioma} lista={sorteo.lista} hechos={sorteo.hechos} />}
      <ListaSuscriptores filas={suscriptores.filas} estado={suscriptores.estado} idioma={idioma} T={A.suscriptores} />
      <ListaMensajes mensajes={mensajes} idioma={idioma} T={A.mensajes} />
      <ListaOpiniones datos={opiniones} idioma={idioma} T={A.opiniones} />

      {datos.estado === "sin_configurar" && (
        <div className="mt-8 flex gap-3 rounded-2xl border border-arena-200 bg-papel p-5 text-sm text-arena-700 dark:border-arena-800 dark:bg-arena-900 dark:text-arena-300">
          <ChartBar size={24} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
          <p>{A.faltaGoatcounter}</p>
        </div>
      )}

      {datos.estado === "error" && (
        <p role="alert" className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {datos.motivo === "clave" ? A.errorClave : datos.motivo === "servidor" ? `${A.errorServidor(datos.status ?? 500)}${datos.ruta ? ` (${datos.ruta.split("?")[0]})` : ""}` : A.errorConexion}
        </p>
      )}

      {datos.estado === "ok" &&
        (() => {
          const puntosDias: Punto[] = datos.dias.map((d) => ({ clave: d.dia, etiqueta: formatoCorto(d.dia, idioma), valor: d.visitas }));
          const puntosHoras: Punto[] = datos.horasHoy.map((v, h) => ({ clave: String(h), etiqueta: horaEtiqueta(h), valor: v }));
          const pais = datos.paises[0];
          const resumen: [string, string | number][] = [
            [A.ultimosDias(periodo), datos.total],
            [A.hoy, datos.dias.at(-1)!.visitas],
            [A.promedio, promedioDiario(datos.dias)],
            [A.paisPrincipal, pais ? paisNombre(pais.id) : "-"],
          ];
          return (
            <>
              <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-arena-200 bg-papel p-5 sm:grid-cols-4 dark:border-arena-800 dark:bg-arena-900">
                {resumen.map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="min-w-0">
                    <dt className="text-xs text-arena-600 sm:text-sm dark:text-arena-400">{etiqueta}</dt>
                    <dd className="truncate text-2xl font-semibold tabular-nums">{valor}</dd>
                  </div>
                ))}
              </dl>

              <section aria-labelledby="titulo-dias" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
                <h2 id="titulo-dias" className="mb-3 font-semibold">
                  {A.visitantesDia}
                </h2>
                <GraficoVisitas
                  puntos={puntosDias}
                  descripcion={A.grafico(periodo)}
                  columnaEtiqueta={A.dia}
                  conSelector
                  cadaEtiqueta={periodo === 7 ? { angosto: 2, ancho: 1 } : periodo === 30 ? { angosto: 14, ancho: 7 } : { angosto: 45, ancho: 15 }}
                />
              </section>

              <section aria-labelledby="titulo-horas" className="mt-6 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
                <h2 id="titulo-horas" className="mb-3 font-semibold">
                  {A.hoyPorHora}
                </h2>
                <GraficoVisitas
                  puntos={puntosHoras}
                  descripcion={A.graficoHoras}
                  columnaEtiqueta={A.hora}
                  modoInicial="lineas"
                  conSelector
                  cadaEtiqueta={{ angosto: 6, ancho: 3 }}
                />
              </section>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <ListaDesglose
                  titulo={A.dispositivos}
                  vacio={A.sinDatos}
                  items={datos.dispositivos.map((d) => ({ clave: d.id, nombre: A.tiposDispositivo[d.id] ?? d.id, visitas: d.visitas }))}
                />
                <ListaDesglose
                  titulo={A.paises}
                  vacio={A.sinDatos}
                  items={datos.paises.map((d) => ({ clave: d.id, nombre: paisNombre(d.id), visitas: d.visitas }))}
                />
                <ListaDesglose
                  titulo={A.sistemas}
                  vacio={A.sinDatos}
                  items={datos.sistemas.map((d) => ({ clave: d.id, nombre: d.nombre, visitas: d.visitas }))}
                />
                <ListaDesglose
                  titulo={A.navegadores}
                  vacio={A.sinDatos}
                  items={datos.navegadores.map((d) => ({ clave: d.id, nombre: d.nombre, visitas: d.visitas }))}
                />
                <ListaDesglose
                  titulo={A.paginas}
                  vacio={A.sinDatos}
                  items={datos.paginas.map((d) => ({
                    clave: d.id,
                    nombre: A.nombresPaginas[d.nombre] ? `${A.nombresPaginas[d.nombre]} (${d.nombre})` : d.nombre,
                    visitas: d.visitas,
                  }))}
                />
                <ListaDesglose
                  titulo={A.origenes}
                  vacio={A.sinDatos}
                  items={datos.origenes.map((d, i) => ({ clave: `${d.id}-${i}`, nombre: d.nombre || A.directo, visitas: d.visitas }))}
                />
                {datos.campanas.length > 0 && (
                  <ListaDesglose
                    titulo={A.campanas}
                    vacio={A.sinDatos}
                    items={datos.campanas.map((d) => ({ clave: d.id, nombre: d.nombre, visitas: d.visitas }))}
                  />
                )}
              </div>

              <p className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-arena-500 dark:text-arena-400">
                {A.actualizado}
                <a
                  href={datos.panel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-oliva-700 hover:underline dark:text-oliva-300"
                >
                  {A.verMas}
                  <ArrowSquareOut size={16} aria-hidden />
                </a>
              </p>
            </>
          );
        })()}
    </main>
  );
}
