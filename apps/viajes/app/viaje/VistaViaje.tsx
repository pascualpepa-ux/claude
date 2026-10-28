"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, CircleNotch, MapTrifold, Info, Train, ArrowRight, BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { FormularioSuscripcion } from "@/components/FormularioSuscripcion";
import { TarjetaDia } from "@/components/TarjetaDia";
import { TarjetaVuelo } from "@/components/TarjetaVuelo";
import { TarjetaHotel } from "@/components/TarjetaHotel";
import { ResumenPresupuesto } from "@/components/ResumenPresupuesto";
import { GastosCompartidos } from "@/components/GastosCompartidos";
import { gastosDeMuestra } from "@/lib/gastos";
import { CLAVE_ABIERTO, CLAVE_PEDIDO, CLAVE_VIAJE, borrarGuardado, guardarViaje, leerGuardados } from "@/lib/almacen";
import { usd } from "@/lib/dinero";
import { formatoCorto } from "@/lib/fechas";
import { ajustarDuraciones, sugerirAerolineas, aplicarClima, aplicarHoteles, aplicarVuelos, estadiasPorCiudad, generarViaje, traducirViaje, viajeDeMuestra } from "@/lib/mock";
import type { DatoClima } from "@/lib/clima-real";
import { useIdioma } from "@/components/ProveedorIdioma";
import { calcularResumen, costoHotel, nochesPorCiudad } from "@/lib/presupuesto";
import type { OpcionHotel, OpcionVuelo, TripInput, TripPlan } from "@/lib/types";

const PASOS_AGENTES = 6;

type DatosClima = Record<string, Record<string, DatoClima>>;

/** Pide el clima real de cada ciudad del viaje. Devuelve null si los agentes no responden. */
async function pedirClima(plan: TripPlan): Promise<DatosClima | null> {
  const lugares = plan.ruta
    .filter((r) => r.aeropuerto)
    .map((r) => ({ iata: r.aeropuerto, fechas: plan.dias.filter((d) => d.clave === r.clave).map((d) => d.fecha) }))
    .filter((l) => l.fechas.length);
  if (!lugares.length) return null;
  try {
    const res = await fetch("/api/clima", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lugares }),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? ((await res.json()) as DatosClima) : null;
  } catch {
    return null;
  }
}

/** Si los agentes del clima no respondieron, cada día queda "sin datos": no se muestra clima inventado. */
function sinClima(plan: TripPlan): DatosClima {
  const datos: DatosClima = {};
  const ahora = new Date().toISOString();
  for (const d of plan.dias) {
    const iata = plan.ruta.find((r) => r.clave === d.clave)?.aeropuerto ?? "";
    (datos[iata] ??= {})[d.fecha] = {
      fecha: d.fecha,
      tipo: "sin_datos",
      condicion: "parcial",
      maxima: 0,
      minima: 0,
      probLluvia: 0,
      estado: "no_verificado",
      fuente: "Open-Meteo",
      consultadoEn: ahora,
    };
  }
  return datos;
}

type RespuestaVuelos =
  | { estado: "ok"; vuelos: OpcionVuelo[] }
  | { estado: "sin_clave" | "sin_cupo" | "sin_resultados" | "error"; distanciaIda: number | null; distanciaVuelta: number | null; aerolineas?: string[] };

/** Pide vuelos reales. Sin ellos, la respuesta trae las distancias para corregir las duraciones de ejemplo. */
async function pedirVuelos(plan: TripPlan): Promise<RespuestaVuelos | null> {
  const { input, ruta } = plan;
  const origen = input.aeropuertoOrigen;
  if (!origen || !ruta.length) return null;
  try {
    const res = await fetch("/api/vuelos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origen,
        destino: ruta[0].aeropuerto,
        regreso: ruta[ruta.length - 1].aeropuerto,
        ida: input.fechaIda,
        vuelta: input.fechaVuelta,
        clase: input.clase,
        aerolinea: input.aerolinea,
        equipaje: input.equipaje,
        idioma: plan.idioma,
      }),
      signal: AbortSignal.timeout(70000),
    });
    return res.ok ? ((await res.json()) as RespuestaVuelos) : null;
  } catch {
    return null;
  }
}

type RespuestaHoteles = { estado: "ok"; hoteles: Record<string, OpcionHotel[]> } | { estado: "sin_clave" | "sin_cupo" | "sin_resultados" | "error" };

/** Pide hoteles reales para cada ciudad del viaje. */
async function pedirHoteles(plan: TripPlan): Promise<RespuestaHoteles | null> {
  if (plan.input.tipoHotel === "propio") return { estado: "sin_resultados" };
  const ciudades = estadiasPorCiudad(plan).filter((c) => c.iata && c.salida > c.entrada);
  if (!ciudades.length) return null;
  try {
    const res = await fetch("/api/hoteles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ciudades,
        viajeros: plan.input.viajeros.length,
        tipo: plan.input.tipoHotel,
        preferido: plan.input.hotelPreferido,
        idioma: plan.idioma,
      }),
      signal: AbortSignal.timeout(70000),
    });
    return res.ok ? ((await res.json()) as RespuestaHoteles) : null;
  } catch {
    return null;
  }
}

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

/** Botón para guardar el viaje en este dispositivo. Una vez guardado, los cambios se guardan solos. */
function BotonGuardar({ idGuardado, error, onGuardar, onQuitar, ancho = false }: {
  idGuardado: string | null;
  error: boolean;
  onGuardar: () => void;
  onQuitar: () => void;
  ancho?: boolean;
}) {
  const { t } = useIdioma();
  const T = t.viaje;
  if (idGuardado) {
    return (
      <div className={ancho ? "mt-3" : ""}>
        <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${ancho ? "justify-center" : ""}`}>
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-oliva-700 dark:text-oliva-300">
            <CheckCircle size={20} weight="fill" aria-hidden />
            {T.guardado}
          </span>
          <button type="button" onClick={onQuitar} className="text-sm text-arena-600 underline underline-offset-2 hover:text-arena-900 dark:text-arena-400 dark:hover:text-arena-100">
            {T.quitarGuardado}
          </button>
        </p>
        <p className={`mt-1 text-xs text-arena-600 dark:text-arena-400 ${ancho ? "text-center" : ""}`}>{T.guardadoNota}</p>
      </div>
    );
  }
  return (
    <div className={ancho ? "mt-3" : ""}>
      <button
        type="button"
        onClick={onGuardar}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-oliva-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200 ${ancho ? "w-full" : ""}`}
      >
        <BookmarkSimple size={18} weight="bold" aria-hidden />
        {T.guardar}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {T.noGuardado}
        </p>
      )}
    </div>
  );
}

export function VistaViaje({ suscripciones = false }: { suscripciones?: boolean }) {
  const params = useSearchParams();
  const esEjemplo = params.get("ejemplo") === "1";
  const { idioma, t } = useIdioma();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [listos, setListos] = useState(0);
  const [estado, setEstado] = useState<"cargando" | "listo" | "vacio">("cargando");
  const [idGuardado, setIdGuardado] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);

  useEffect(() => {
    const pedido: TripInput | null = esEjemplo ? viajeDeMuestra() : leer<TripInput>(CLAVE_PEDIDO);
    if (!pedido) {
      setEstado("vacio");
      return;
    }
    const guardado = esEjemplo ? null : leer<TripPlan>(CLAVE_VIAJE);
    // Un viaje guardado por una versión anterior (sin idioma) se vuelve a armar.
    if (guardado?.idioma && JSON.stringify(guardado.input) === JSON.stringify(pedido)) {
      // Si es un viaje guardado (abierto desde la portada), sigue vinculado: los cambios se guardan solos.
      try {
        const abierto = sessionStorage.getItem(CLAVE_ABIERTO);
        if (abierto && leerGuardados().some((v) => v.id === abierto)) setIdGuardado(abierto);
      } catch {}
      // Viajes armados antes de que existiera el vuelo estimado: se cambian los vuelos de ejemplo por la estimación.
      const actualizado =
        !guardado.vuelosReales && !guardado.vuelos.some((v) => v.estimado)
          ? (() => {
              const nuevos = generarViaje(guardado.input, guardado.idioma);
              return { ...guardado, vuelos: nuevos.vuelos, vueloElegido: nuevos.vueloElegido };
            })()
          : guardado;
      setPlan(traducirViaje(actualizado, idioma));
      setEstado("listo");
      if (actualizado !== guardado) {
        pedirVuelos(actualizado).then((v) => {
          if (v && v.estado !== "ok") setPlan((p) => (p ? sugerirAerolineas(ajustarDuraciones(p, v.distanciaIda, v.distanciaVuelta), v.aerolineas) : p));
        });
      }
      // El clima se vuelve a pedir cada vez que se abre: así el pronóstico está siempre al día.
      pedirClima(guardado).then((datos) =>
        setPlan((p) => {
          if (!p) return p;
          if (datos) return aplicarClima(p, datos, p.idioma);
          // Sin respuesta: se queda con el último clima real; si nunca tuvo, no muestra el de ejemplo.
          return p.climaReal ? p : aplicarClima(p, sinClima(p), p.idioma);
        }),
      );
      return;
    }
    const nuevo = generarViaje(pedido, idioma);
    // Cada par de pasos es un agente buscador y su verificador: la lista avanza cuando responden de verdad.
    // Pasos 1-2: clima. Pasos 3-4: vuelos. Pasos 5-6: hoteles.
    let clima: DatosClima | null | undefined;
    let vuelos: RespuestaVuelos | null | undefined;
    let hoteles: RespuestaHoteles | null | undefined;
    pedirClima(nuevo).then((datos) => (clima = datos));
    pedirVuelos(nuevo).then((datos) => (vuelos = datos));
    pedirHoteles(nuevo).then((datos) => (hoteles = datos));
    let i = 0;
    const timer = setInterval(() => {
      if ((i >= 1 && clima === undefined) || (i >= 3 && vuelos === undefined) || (i >= 5 && hoteles === undefined)) return;
      i++;
      setListos(i);
      if (i >= PASOS_AGENTES) {
        clearInterval(timer);
        let armado = aplicarClima(nuevo, clima ?? sinClima(nuevo), idioma);
        if (vuelos?.estado === "ok") armado = aplicarVuelos(armado, vuelos.vuelos);
        else if (vuelos) armado = sugerirAerolineas(ajustarDuraciones(armado, vuelos.distanciaIda, vuelos.distanciaVuelta), vuelos.aerolineas);
        if (hoteles?.estado === "ok") armado = aplicarHoteles(armado, hoteles.hoteles);
        // El viaje de ejemplo trae gastos de muestra para ver cómo funciona "quién debe a quién".
        if (esEjemplo) armado = { ...armado, gastos: gastosDeMuestra(armado.input.viajeros, idioma) };
        setPlan(armado);
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

  // Con el viaje ya guardado, cada cambio (otro vuelo, otro hotel, actividades) actualiza la copia guardada.
  useEffect(() => {
    if (!plan || !idGuardado) return;
    const previo = leerGuardados().find((v) => v.id === idGuardado);
    if (!previo) return setIdGuardado(null); // lo borró desde otra pestaña
    if (JSON.stringify(previo.plan) !== JSON.stringify(plan)) guardarViaje(plan, idGuardado);
  }, [plan, idGuardado]);

  const guardar = () => {
    if (!plan) return;
    const id = guardarViaje(plan);
    setErrorGuardar(!id);
    if (!id) return;
    setIdGuardado(id);
    try {
      sessionStorage.setItem(CLAVE_ABIERTO, id);
    } catch {}
  };
  const quitarGuardado = () => {
    if (!idGuardado) return;
    borrarGuardado(idGuardado);
    setIdGuardado(null);
    try {
      sessionStorage.removeItem(CLAVE_ABIERTO);
    } catch {}
  };

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
              {t.viaje.titulo(
                input.aeropuertoOrigen ? t.viaje.conAeropuerto(input.origen, input.aeropuertoOrigen) : input.origen,
                input.aeropuertoDestino ? t.viaje.conAeropuerto(input.destino, input.aeropuertoDestino) : input.destino,
              )}
            </h1>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.viaje.viajeros}>
              {input.viajeros.map((v) => (
                <li key={v} className="rounded-full bg-arena-200/70 px-3 py-1 text-sm dark:bg-arena-800">
                  {v}
                </li>
              ))}
            </ul>
            {!esEjemplo && (
              <div className="mt-4">
                <BotonGuardar idGuardado={idGuardado} error={errorGuardar} onGuardar={guardar} onQuitar={quitarGuardado} />
              </div>
            )}
          </header>

          <p className="mt-6 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Info size={20} className="shrink-0" aria-hidden />
            {plan.vuelosReales && plan.vuelos.some((v) => v.precioEstimado) ? t.viaje.avisoHorarios : plan.vuelosReales && plan.hotelesReales ? t.viaje.avisoTodo : plan.vuelosReales ? t.viaje.avisoVuelos : plan.hotelesReales ? t.viaje.avisoHoteles : t.viaje.aviso}
          </p>

          <nav aria-label={t.viaje.secciones} className="sticky top-16 z-20 -mx-4 mt-6 overflow-x-auto bg-arena-50/90 px-4 py-2 backdrop-blur dark:bg-arena-950/90">
            <ul className="flex gap-1.5 text-sm font-medium whitespace-nowrap sm:gap-2">
              {[
                ["#itinerario", t.viaje.nav.itinerario],
                ["#vuelos", t.viaje.nav.vuelos],
                ["#alojamiento", t.viaje.nav.alojamiento],
                ["#presupuesto", t.viaje.nav.presupuesto],
                ["#gastos", t.viaje.nav.gastos],
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
            {input.tipoHotel === "propio" && (
              <p className="mt-3 rounded-xl border border-arena-200 bg-papel px-4 py-3 text-sm text-arena-700 dark:border-arena-800 dark:bg-arena-900 dark:text-arena-300">
                {t.viaje.alojamientoPropio}
              </p>
            )}
            {input.tipoHotel !== "propio" && plan.ruta.map((r) => (
              <div key={r.clave} className="mt-4">
                <h3 className="text-sm font-medium text-arena-600 dark:text-arena-400">{t.viaje.ciudadNoches(r.ciudad, r.dias)}</h3>
                <div className="mt-3 grid gap-4">
                  {(plan.hoteles[r.clave] ?? []).map((h) => (
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

          <GastosCompartidos
            viajeros={plan.input.viajeros}
            gastos={plan.gastos ?? []}
            onCambiar={(gastos) => setPlan({ ...plan, gastos })}
          />
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ResumenPresupuesto resumen={resumen} />
          <Link
            href="/planificar"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-arena-300 px-4 py-2.5 text-sm font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
          >
            {t.viaje.cambiar}
          </Link>
          {!esEjemplo && <BotonGuardar idGuardado={idGuardado} error={errorGuardar} onGuardar={guardar} onQuitar={quitarGuardado} ancho />}
          {!esEjemplo && suscripciones && (
            <div className="mt-6">
              <FormularioSuscripcion plan={plan} />
            </div>
          )}
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
