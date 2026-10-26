"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, CircleNotch, MapTrifold, Info, Train, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { TarjetaDia } from "@/components/TarjetaDia";
import { TarjetaVuelo } from "@/components/TarjetaVuelo";
import { TarjetaHotel } from "@/components/TarjetaHotel";
import { ResumenPresupuesto } from "@/components/ResumenPresupuesto";
import { CLAVE_PEDIDO, CLAVE_VIAJE } from "@/lib/almacen";
import { usd } from "@/lib/dinero";
import { formatoCorto } from "@/lib/fechas";
import { generarViaje, traducirViaje, viajeDeMuestra } from "@/lib/mock";
import { useIdioma } from "@/components/ProveedorIdioma";
import { calcularResumen, costoHotel, nochesPorCiudad } from "@/lib/presupuesto";
import type { TripInput, TripPlan } from "@/lib/types";

const PASOS_AGENTES = 6;

function leer<T>(clave: string): T | null {
  try {
    const v = sessionStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function AgentesTrabajando({ listos }: { listos: number }) {
  const { t } = useIdioma();
  return (
    <div className="mx-auto max-w-md px-4 py-20" role="status" aria-live="polite">
      <h1 className="text-2xl font-semibold tracking-tight">{t.viaje.armando}</h1>
      <p className="mt-2 text-arena-600 dark:text-arena-400">{t.viaje.armandoBajada}</p>
      <ul className="mt-8 grid gap-3">
        {t.viaje.agentes.map((nombre, i) => (
          <li key={nombre} className="flex items-center gap-3 text-sm">
            {i < listos ? (
              <CheckCircle size={20} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
            ) : i === listos ? (
              <CircleNotch size={20} className="animate-spin text-arena-500 motion-reduce:animate-none" aria-hidden />
            ) : (
              <span className="size-5 rounded-full border border-arena-300 dark:border-arena-700" aria-hidden />
            )}
            <span className={i <= listos ? "" : "text-arena-500 dark:text-arena-400"}>{nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SinViaje() {
  const { t } = useIdioma();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <MapTrifold size={48} weight="duotone" className="mx-auto text-oliva-700 dark:text-oliva-300" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t.viaje.vacioTitulo}</h1>
      <p className="mt-2 text-arena-600 dark:text-arena-400">{t.viaje.vacioBajada}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/planificar" className="rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200">
          {t.viaje.planificar}
        </Link>
        <Link href="/viaje?ejemplo=1" className="rounded-xl border border-arena-300 bg-papel px-5 py-3 font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:bg-arena-900 dark:hover:bg-arena-800">
          {t.viaje.ejemplo}
        </Link>
      </div>
    </div>
  );
}

export function VistaViaje() {
  const params = useSearchParams();
  const esEjemplo = params.get("ejemplo") === "1";
  const { idioma, t } = useIdioma();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [listos, setListos] = useState(0);
  const [estado, setEstado] = useState<"cargando" | "listo" | "vacio">("cargando");

  useEffect(() => {
    const pedido: TripInput | null = esEjemplo ? viajeDeMuestra() : leer<TripInput>(CLAVE_PEDIDO);
    if (!pedido) {
      setEstado("vacio");
      return;
    }
    const guardado = esEjemplo ? null : leer<TripPlan>(CLAVE_VIAJE);
    // Un viaje guardado por una versión anterior (sin idioma) se vuelve a armar.
    if (guardado?.idioma && JSON.stringify(guardado.input) === JSON.stringify(pedido)) {
      setPlan(traducirViaje(guardado, idioma));
      setEstado("listo");
      return;
    }
    // Fase 1: simula a los agentes trabajando. En la fase 3 esto refleja el progreso real.
    const nuevo = generarViaje(pedido, idioma);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setListos(i);
      if (i >= PASOS_AGENTES) {
        clearInterval(timer);
        setPlan(nuevo);
        setEstado("listo");
      }
    }, 280);
    return () => clearInterval(timer);
    // El idioma se aplica aparte (efecto de abajo) para no repetir la animación al cambiarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esEjemplo]);

  // Al cambiar de idioma se traduce el viaje conservando lo que la persona eligió.
  useEffect(() => {
    setPlan((actual) => (actual && actual.idioma !== idioma ? traducirViaje(actual, idioma) : actual));
  }, [idioma]);

  useEffect(() => {
    if (!plan || esEjemplo) return;
    try {
      sessionStorage.setItem(CLAVE_VIAJE, JSON.stringify(plan));
    } catch {}
  }, [plan, esEjemplo]);

  const resumen = useMemo(() => (plan ? calcularResumen(plan) : null), [plan]);

  if (estado === "vacio") return <SinViaje />;
  if (!plan || !resumen) return <AgentesTrabajando listos={listos} />;

  const { input } = plan;
  const usadas = new Set(plan.dias.flatMap((d) => d.actividades));
  const noches = nochesPorCiudad(plan);

  const quitar = (diaIdx: number, id: string) =>
    setPlan({ ...plan, dias: plan.dias.map((d, i) => (i === diaIdx ? { ...d, actividades: d.actividades.filter((x) => x !== id) } : d)) });
  const agregar = (diaIdx: number, id: string) =>
    setPlan({ ...plan, dias: plan.dias.map((d, i) => (i === diaIdx ? { ...d, actividades: [...d.actividades, id] } : d)) });

  return (
    <>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-16">
        <div className="min-w-0">
          <header className="aparecer">
            <p className="text-sm text-arena-600 dark:text-arena-400">
              {t.viaje.fechasPlan(formatoCorto(input.fechaIda, idioma), formatoCorto(input.fechaVuelta, idioma), t.viaje.planes[input.plan])}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {t.viaje.titulo(input.origen, input.destino)}
            </h1>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.viaje.viajeros}>
              {input.viajeros.map((v) => (
                <li key={v} className="rounded-full bg-arena-200/70 px-3 py-1 text-sm dark:bg-arena-800">
                  {v}
                </li>
              ))}
            </ul>
          </header>

          <p className="mt-6 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Info size={20} className="shrink-0" aria-hidden />
            {t.viaje.aviso}
          </p>

          <nav aria-label={t.viaje.secciones} className="sticky top-16 z-20 -mx-4 mt-6 overflow-x-auto bg-arena-50/90 px-4 py-2 backdrop-blur dark:bg-arena-950/90">
            <ul className="flex gap-1.5 text-sm font-medium whitespace-nowrap sm:gap-2">
              {[
                ["#itinerario", t.viaje.nav.itinerario],
                ["#vuelos", t.viaje.nav.vuelos],
                ["#alojamiento", t.viaje.nav.alojamiento],
                ["#presupuesto", t.viaje.nav.presupuesto],
              ].map(([href, texto]) => (
                <li key={href}>
                  <a href={href} className="block rounded-full border border-arena-300 px-2.5 py-1 sm:px-3 sm:py-1.5 transition hover:border-oliva-700 hover:text-oliva-800 dark:border-arena-700 dark:hover:border-oliva-300 dark:hover:text-oliva-300">
                    {texto}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {plan.rutaSugerida && (
            <section aria-labelledby="titulo-ruta" className="mt-8">
              <h2 id="titulo-ruta" className="text-xl font-semibold tracking-tight">
                {t.viaje.rutaTitulo}
              </h2>
              <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
                {t.viaje.rutaBajada}
              </p>
              <ol className="mt-4 flex flex-wrap items-center gap-2">
                {plan.ruta.map((r, i) => (
                  <li key={r.clave} className="flex items-center gap-2">
                    {i > 0 && <Train size={18} className="text-arena-400" aria-label={t.viaje.enTren} />}
                    <span className="rounded-xl border border-arena-200 bg-papel px-3 py-2 dark:border-arena-800 dark:bg-arena-900">
                      <span className="font-medium">{r.ciudad}</span>{" "}
                      <span className="text-sm text-arena-600 dark:text-arena-400">
                        {t.viaje.noches(r.dias)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              {plan.traslados.map((tr) => (
                <p key={tr.fecha} className="mt-2 text-sm text-arena-600 dark:text-arena-400">
                  {t.viaje.traslado(tr.medio, tr.desde, tr.hasta, formatoCorto(tr.fecha, idioma), usd(tr.precioPorPersona, idioma))}
                </p>
              ))}
            </section>
          )}

          <section id="itinerario" aria-labelledby="titulo-itinerario" className="mt-10">
            <h2 id="titulo-itinerario" className="text-xl font-semibold tracking-tight">
              {t.viaje.itinerarioTitulo}
            </h2>
            <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
              {t.viaje.itinerarioBajada}
            </p>
            <div className="mt-4 grid gap-4">
              {plan.dias.map((dia, i) => (
                <TarjetaDia
                  key={dia.fecha}
                  numero={i + 1}
                  dia={dia}
                  actividades={dia.actividades.map((id) => plan.actividades.find((a) => a.id === id)!).filter(Boolean)}
                  sugerencias={plan.actividades.filter((a) => a.ciudad === dia.ciudad && !usadas.has(a.id))}
                  onQuitar={(id) => quitar(i, id)}
                  onAgregar={(id) => agregar(i, id)}
                />
              ))}
            </div>
          </section>

          <section id="vuelos" aria-labelledby="titulo-vuelos" className="mt-12">
            <h2 id="titulo-vuelos" className="text-xl font-semibold tracking-tight">
              {t.viaje.vuelosTitulo}
            </h2>
            <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">
              {plan.ruta.length > 1
                ? t.viaje.vuelosMultiples(plan.ruta[0].ciudad, plan.ruta.at(-1)!.ciudad)
                : t.viaje.vuelosUna}
            </p>
            <div className="mt-4 grid gap-4">
              {plan.vuelos.map((v) => (
                <TarjetaVuelo
                  key={v.id}
                  vuelo={v}
                  personas={resumen.personas}
                  elegido={v.id === plan.vueloElegido}
                  onElegir={() => setPlan({ ...plan, vueloElegido: v.id })}
                />
              ))}
            </div>
          </section>

          <section id="alojamiento" aria-labelledby="titulo-alojamiento" className="mt-12">
            <h2 id="titulo-alojamiento" className="text-xl font-semibold tracking-tight">
              {t.viaje.alojamientoTitulo}
            </h2>
            {plan.ruta.map((r) => (
              <div key={r.clave} className="mt-4">
                <h3 className="text-sm font-medium text-arena-600 dark:text-arena-400">{t.viaje.ciudadNoches(r.ciudad, r.dias)}</h3>
                <div className="mt-3 grid gap-4">
                  {plan.hoteles[r.clave].map((h) => (
                    <TarjetaHotel
                      key={h.id}
                      hotel={h}
                      noches={noches[r.clave]}
                      total={costoHotel(plan, r.clave, h.id)}
                      elegido={plan.hotelElegido[r.clave] === h.id}
                      onElegir={() => setPlan({ ...plan, hotelElegido: { ...plan.hotelElegido, [r.clave]: h.id } })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ResumenPresupuesto resumen={resumen} />
          <Link
            href="/planificar"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-arena-300 px-4 py-2.5 text-sm font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
          >
            {t.viaje.cambiar}
          </Link>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-arena-200 bg-papel/95 px-4 py-3 backdrop-blur lg:hidden dark:border-arena-800 dark:bg-arena-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold tabular-nums">{usd(resumen.total, idioma)}</p>
            <p className={`text-xs ${resumen.rango.estado === "excedido" ? "text-red-700 dark:text-red-400" : "text-arena-600 dark:text-arena-400"}`}>
              {t.viaje.porPersona(usd(resumen.porPersona, idioma))}
              {resumen.rango.estado === "excedido" && t.viaje.fuera}
            </p>
          </div>
          <a href="#presupuesto" className="inline-flex items-center gap-1.5 rounded-xl bg-oliva-700 px-4 py-2.5 text-sm font-medium text-white active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950">
            {t.viaje.detalle}
            <ArrowRight size={16} weight="bold" aria-hidden />
          </a>
        </div>
      </div>
    </>
  );
}
