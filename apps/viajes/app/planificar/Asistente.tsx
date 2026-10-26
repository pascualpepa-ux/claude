"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Trash, Backpack, Suitcase } from "@phosphor-icons/react/dist/ssr";
import { diferenciaDias, hoy, sumarDias } from "@/lib/fechas";
import { resolverDestino } from "@/lib/destinos";
import { CLAVE_BORRADOR, CLAVE_PEDIDO, CLAVE_VIAJE } from "@/lib/almacen";
import type { Textos } from "@/lib/textos";
import { useIdioma } from "@/components/ProveedorIdioma";
import type { Clase, Equipaje, ModoPresupuesto, Plan, TipoHotel, TripInput } from "@/lib/types";


interface Borrador extends Omit<TripInput, "presupuestoMin" | "presupuestoMax"> {
  modoFechas: "fechas" | "dias";
  cantidadDias: string;
  presupuestoMin: string;
  presupuestoMax: string;
}

function borradorInicial(): Borrador {
  const ida = sumarDias(hoy(), 30);
  return {
    origen: "",
    destino: "",
    modoFechas: "fechas",
    fechaIda: ida,
    fechaVuelta: sumarDias(ida, 7),
    cantidadDias: "7",
    viajeros: [""],
    presupuestoMin: "",
    presupuestoMax: "",
    modoPresupuesto: "persona",
    aerolinea: "",
    clase: "economica",
    tipoHotel: "3",
    hotelPreferido: "",
    plan: "equilibrado",
    equipaje: "valija",
  };
}

const TOTAL_PASOS = 7;

type Errores = Partial<Record<string, string>>;

function validar(paso: number, b: Borrador, E: Textos["asistente"]["errores"]): Errores {
  const e: Errores = {};
  if (paso === 0) {
    if (!b.origen.trim()) e.origen = E.origen;
    if (!b.destino.trim()) e.destino = E.destino;
  }
  if (paso === 1) {
    if (b.modoFechas === "fechas") {
      if (!b.fechaIda) e.fechaIda = E.idaFalta;
      else if (diferenciaDias(hoy(), b.fechaIda) < 0) e.fechaIda = E.idaPasada;
      if (!b.fechaVuelta) e.fechaVuelta = E.vueltaFalta;
      else if (b.fechaIda && diferenciaDias(b.fechaIda, b.fechaVuelta) < 1)
        e.fechaVuelta = E.vueltaAntes;
      else if (b.fechaIda && diferenciaDias(b.fechaIda, b.fechaVuelta) > 60)
        e.fechaVuelta = E.vueltaLarga;
    } else {
      const n = Number(b.cantidadDias);
      if (!Number.isInteger(n) || n < 2 || n > 60) e.cantidadDias = E.dias;
    }
  }
  if (paso === 2) {
    b.viajeros.forEach((v, i) => {
      if (!v.trim()) e[`viajero-${i}`] = E.nombre;
    });
    const repetidos = b.viajeros.map((v) => v.trim().toLowerCase()).filter((v, i, arr) => v && arr.indexOf(v) !== i);
    if (repetidos.length) e.viajeros = E.repetidos;
  }
  if (paso === 3) {
    const min = Number(b.presupuestoMin || 0);
    const max = Number(b.presupuestoMax);
    if (!b.presupuestoMax || !(max > 0)) e.presupuestoMax = E.maximo;
    if (b.presupuestoMin && !(min >= 0)) e.presupuestoMin = E.minimoNumero;
    if (max > 0 && min > max) e.presupuestoMin = E.minimoMayor;
  }
  return e;
}

function aPedido(b: Borrador): TripInput {
  const fechaIda = b.modoFechas === "fechas" ? b.fechaIda : sumarDias(hoy(), 30);
  const fechaVuelta = b.modoFechas === "fechas" ? b.fechaVuelta : sumarDias(fechaIda, Number(b.cantidadDias) - 1);
  return {
    origen: b.origen.trim(),
    destino: b.destino.trim(),
    fechaIda,
    fechaVuelta,
    viajeros: b.viajeros.map((v) => v.trim()),
    presupuestoMin: Number(b.presupuestoMin || 0),
    presupuestoMax: Number(b.presupuestoMax),
    modoPresupuesto: b.modoPresupuesto,
    aerolinea: b.aerolinea.trim(),
    clase: b.clase,
    tipoHotel: b.tipoHotel,
    hotelPreferido: b.hotelPreferido.trim(),
    plan: b.plan,
    equipaje: b.equipaje,
  };
}

/* ---------- Piezas de formulario ---------- */

const claseCampo =
  "w-full rounded-xl border bg-papel px-3.5 py-2.5 text-base text-arena-900 placeholder:text-arena-500 transition focus:outline-none focus:ring-2 focus:ring-oliva-600/40 dark:bg-arena-900 dark:text-arena-100 dark:placeholder:text-arena-500 dark:focus:ring-oliva-300/40";

function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => React.ReactNode;
}) {
  const id = useId();
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": descripcion,
        className: `${claseCampo} ${error ? "border-red-500 dark:border-red-400" : "border-arena-300 focus:border-oliva-600 dark:border-arena-700 dark:focus:border-oliva-300"}`,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="text-sm text-arena-600 dark:text-arena-400">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

function Opciones<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
  columnas = 2,
}: {
  etiqueta: string;
  valor: T;
  opciones: { valor: T; titulo: string; detalle?: string; Icono?: React.ElementType }[];
  onCambio: (v: T) => void;
  columnas?: 2 | 3;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">{etiqueta}</legend>
      <div className={`grid gap-2 ${columnas === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <label
              key={o.valor}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oliva-600/40 ${
                activo
                  ? "border-oliva-700 bg-oliva-50 dark:border-oliva-300 dark:bg-oliva-950/40"
                  : "border-arena-300 bg-papel hover:border-arena-400 dark:border-arena-700 dark:bg-arena-900 dark:hover:border-arena-500"
              }`}
            >
              <input
                type="radio"
                name={etiqueta}
                value={o.valor}
                checked={activo}
                onChange={() => onCambio(o.valor)}
                className="sr-only"
              />
              {o.Icono && (
                <o.Icono
                  size={22}
                  weight="duotone"
                  className={activo ? "text-oliva-700 dark:text-oliva-300" : "text-arena-500"}
                  aria-hidden
                />
              )}
              <span>
                <span className="block font-medium">{o.titulo}</span>
                {o.detalle && <span className="block text-sm text-arena-600 dark:text-arena-400">{o.detalle}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------- Asistente ---------- */

export function Asistente() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [b, setB] = useState<Borrador>(borradorInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [cargado, setCargado] = useState(false);
  const { idioma, t } = useIdioma();
  const A = t.asistente;

  // Al cambiar de idioma se borran los avisos de error (estaban escritos en el idioma anterior).
  useEffect(() => setErrores({}), [idioma]);

  // Recupera el borrador si el usuario vuelve atrás o recarga la página.
  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(CLAVE_BORRADOR);
      if (guardado) setB({ ...borradorInicial(), ...JSON.parse(guardado) });
    } catch {}
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    try {
      sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    } catch {}
  }, [b, cargado]);

  const cambiar = <K extends keyof Borrador>(clave: K, valor: Borrador[K]) => {
    setB((prev) => ({ ...prev, [clave]: valor }));
    setErrores((prev) => ({ ...prev, [clave]: undefined }));
  };

  const siguiente = () => {
    const e = validar(paso, b, A.errores);
    setErrores(e);
    if (Object.keys(e).length) return;
    if (paso < TOTAL_PASOS - 1) {
      setPaso(paso + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    try {
      sessionStorage.setItem(CLAVE_PEDIDO, JSON.stringify(aPedido(b)));
      sessionStorage.removeItem(CLAVE_VIAJE);
    } catch {}
    router.push("/viaje");
  };

  const destinoResuelto = b.destino.trim() ? resolverDestino(b.destino) : null;
  const noches = b.modoFechas === "fechas" ? diferenciaDias(b.fechaIda || hoy(), b.fechaVuelta || hoy()) : Number(b.cantidadDias) - 1;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-16 md:pt-14">
      <div className="mb-8">
        <p className="text-sm text-arena-600 dark:text-arena-400">
          {A.paso(paso + 1, TOTAL_PASOS)}
        </p>
        <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label={A.progreso}>
          {A.pasos.map((nombre, i) => (
            <li
              key={nombre}
              className={`h-1.5 rounded-full transition-colors ${i <= paso ? "bg-oliva-700 dark:bg-oliva-400" : "bg-arena-200 dark:bg-arena-800"}`}
              aria-current={i === paso ? "step" : undefined}
            >
              <span className="sr-only">{nombre}</span>
            </li>
          ))}
        </ol>
      </div>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          siguiente();
        }}
        noValidate
      >
        <h1 key={paso} className="aparecer text-3xl font-semibold tracking-tight md:text-4xl">
          {A.titulos[paso]}
        </h1>

        <div key={`c-${paso}`} className="aparecer mt-8 grid gap-6">
          {paso === 0 && (
            <>
              <Campo etiqueta={A.origen} error={errores.origen}>
                {(p) => (
                  <input {...p} value={b.origen} onChange={(e) => cambiar("origen", e.target.value)} placeholder={A.origenEj} autoComplete="off" />
                )}
              </Campo>
              <Campo
                etiqueta={A.destino}
                error={errores.destino}
                ayuda={
                  destinoResuelto?.tipo === "pais"
                    ? A.destinoPais(destinoResuelto.pais.nombre[idioma])
                    : A.destinoAyuda
                }
              >
                {(p) => (
                  <input {...p} value={b.destino} onChange={(e) => cambiar("destino", e.target.value)} placeholder={A.destinoEj} autoComplete="off" />
                )}
              </Campo>
            </>
          )}

          {paso === 1 && (
            <>
              <Opciones
                etiqueta={A.tenesFechas}
                valor={b.modoFechas}
                onCambio={(v) => cambiar("modoFechas", v)}
                opciones={[
                  { valor: "fechas", titulo: A.siFechas },
                  { valor: "dias", titulo: A.soloDias },
                ]}
              />
              {b.modoFechas === "fechas" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Campo etiqueta={A.ida} error={errores.fechaIda}>
                    {(p) => <input {...p} type="date" min={hoy()} value={b.fechaIda} onChange={(e) => cambiar("fechaIda", e.target.value)} />}
                  </Campo>
                  <Campo etiqueta={A.vuelta} error={errores.fechaVuelta}>
                    {(p) => (
                      <input {...p} type="date" min={b.fechaIda || hoy()} value={b.fechaVuelta} onChange={(e) => cambiar("fechaVuelta", e.target.value)} />
                    )}
                  </Campo>
                </div>
              ) : (
                <Campo
                  etiqueta={A.cantidadDias}
                  error={errores.cantidadDias}
                  ayuda={A.cantidadAyuda}
                >
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={2} max={60} value={b.cantidadDias} onChange={(e) => cambiar("cantidadDias", e.target.value)} />
                  )}
                </Campo>
              )}
              {noches >= 1 && !errores.fechaVuelta && !errores.cantidadDias && (
                <p className="text-sm text-arena-600 dark:text-arena-400">
                  {A.duracion(noches + 1, noches)}
                </p>
              )}
            </>
          )}

          {paso === 2 && (
            <>
              <p className="-mt-2 text-arena-600 dark:text-arena-400">{A.viajerosAyuda}</p>
              {b.viajeros.map((v, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Campo etiqueta={A.viajero(i + 1)} error={errores[`viajero-${i}`]}>
                      {(p) => (
                        <input
                          {...p}
                          value={v}
                          autoComplete="off"
                          placeholder={i === 0 ? A.tuNombre : A.nombre}
                          onChange={(e) => {
                            const lista = [...b.viajeros];
                            lista[i] = e.target.value;
                            setB({ ...b, viajeros: lista });
                            setErrores((prev) => ({ ...prev, [`viajero-${i}`]: undefined, viajeros: undefined }));
                          }}
                        />
                      )}
                    </Campo>
                  </div>
                  {b.viajeros.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setB({ ...b, viajeros: b.viajeros.filter((_, j) => j !== i) })}
                      className={`grid size-11 shrink-0 place-items-center rounded-xl border border-arena-300 text-arena-600 transition hover:bg-arena-100 active:scale-95 dark:border-arena-700 dark:text-arena-400 dark:hover:bg-arena-800 ${errores[`viajero-${i}`] ? "mb-7" : ""}`}
                      aria-label={A.quitarViajero(i + 1)}
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              ))}
              {errores.viajeros && <p className="text-sm text-red-700 dark:text-red-400">{errores.viajeros}</p>}
              {b.viajeros.length < 12 && (
                <button
                  type="button"
                  onClick={() => setB({ ...b, viajeros: [...b.viajeros, ""] })}
                  className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-oliva-700 transition hover:bg-oliva-50 dark:text-oliva-300 dark:hover:bg-oliva-950/50"
                >
                  <Plus size={16} weight="bold" aria-hidden />
                  {A.sumarViajero}
                </button>
              )}
            </>
          )}

          {paso === 3 && (
            <>
              <Opciones<ModoPresupuesto>
                etiqueta={A.presupuestoEs}
                valor={b.modoPresupuesto}
                onCambio={(v) => cambiar("modoPresupuesto", v)}
                opciones={[
                  { valor: "persona", titulo: A.porPersona },
                  { valor: "total", titulo: A.grupo },
                ]}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo etiqueta={A.minimo} error={errores.presupuestoMin} ayuda={A.opcional}>
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={0} step={50} value={b.presupuestoMin} onChange={(e) => cambiar("presupuestoMin", e.target.value)} placeholder={A.ejMin} />
                  )}
                </Campo>
                <Campo etiqueta={A.maximo} error={errores.presupuestoMax}>
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={0} step={50} value={b.presupuestoMax} onChange={(e) => cambiar("presupuestoMax", e.target.value)} placeholder={A.ejMax} />
                  )}
                </Campo>
              </div>
              <p className="text-sm text-arena-600 dark:text-arena-400">
                {A.presupuestoAyuda}
              </p>
            </>
          )}

          {paso === 4 && (
            <>
              <Campo etiqueta={A.aerolinea} ayuda={A.aerolineaAyuda}>
                {(p) => <input {...p} value={b.aerolinea} onChange={(e) => cambiar("aerolinea", e.target.value)} placeholder={A.cualquiera} autoComplete="off" />}
              </Campo>
              <Opciones<Clase>
                etiqueta={A.clase}
                valor={b.clase}
                onCambio={(v) => cambiar("clase", v)}
                columnas={3}
                opciones={[
                  { valor: "economica", titulo: A.clases.economica },
                  { valor: "premium", titulo: A.clases.premium },
                  { valor: "business", titulo: A.clases.business },
                ]}
              />
              <Opciones<Equipaje>
                etiqueta={A.equipaje}
                valor={b.equipaje}
                onCambio={(v) => cambiar("equipaje", v)}
                opciones={[
                  { valor: "mano", titulo: A.soloMano, detalle: A.soloManoDetalle, Icono: Backpack },
                  { valor: "valija", titulo: A.conValija, detalle: A.conValijaDetalle, Icono: Suitcase },
                ]}
              />
            </>
          )}

          {paso === 5 && (
            <>
              <Opciones<TipoHotel>
                etiqueta={A.tipoAlojamiento}
                valor={b.tipoHotel}
                onCambio={(v) => cambiar("tipoHotel", v)}
                columnas={3}
                opciones={[
                  { valor: "hostel", titulo: A.alojamientos["hostel"] },
                  { valor: "3", titulo: A.alojamientos["3"] },
                  { valor: "4", titulo: A.alojamientos["4"] },
                  { valor: "5", titulo: A.alojamientos["5"] },
                  { valor: "depto", titulo: A.alojamientos["depto"] },
                ]}
              />
              <Campo etiqueta={A.hotelPreferido} ayuda={A.hotelAyuda}>
                {(p) => <input {...p} value={b.hotelPreferido} onChange={(e) => cambiar("hotelPreferido", e.target.value)} placeholder={A.nombreHotel} autoComplete="off" />}
              </Campo>
            </>
          )}

          {paso === 6 && (
            <Opciones<Plan>
              etiqueta={A.estilo}
              valor={b.plan}
              onCambio={(v) => cambiar("plan", v)}
              columnas={3}
              opciones={[
                { valor: "economico", titulo: A.estilos.economico[0], detalle: A.estilos.economico[1] },
                { valor: "equilibrado", titulo: A.estilos.equilibrado[0], detalle: A.estilos.equilibrado[1] },
                { valor: "premium", titulo: A.estilos.premium[0], detalle: A.estilos.premium[1] },
              ]}
            />
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-arena-200 pt-6 dark:border-arena-800">
          {paso > 0 ? (
            <button
              type="button"
              onClick={() => {
                setErrores({});
                setPaso(paso - 1);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-arena-700 transition hover:bg-arena-100 active:scale-[0.98] dark:text-arena-300 dark:hover:bg-arena-800"
            >
              <ArrowLeft size={18} aria-hidden />
              {A.atras}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
          >
            {paso === TOTAL_PASOS - 1 ? A.armar : A.siguiente}
            <ArrowRight size={18} weight="bold" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
