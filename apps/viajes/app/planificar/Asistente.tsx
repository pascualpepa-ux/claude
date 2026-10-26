"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Trash, Backpack, Suitcase } from "@phosphor-icons/react/dist/ssr";
import { diferenciaDias, hoy, sumarDias } from "@/lib/fechas";
import { resolverDestino } from "@/lib/destinos";
import { CLAVE_BORRADOR, CLAVE_PEDIDO, CLAVE_VIAJE } from "@/lib/almacen";
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

const PASOS = ["Destino", "Fechas", "Viajeros", "Presupuesto", "Vuelo", "Alojamiento", "Estilo de viaje"] as const;

type Errores = Partial<Record<string, string>>;

function validar(paso: number, b: Borrador): Errores {
  const e: Errores = {};
  if (paso === 0) {
    if (!b.origen.trim()) e.origen = "Contanos desde dónde salen.";
    if (!b.destino.trim()) e.destino = "Contanos a dónde quieren ir.";
  }
  if (paso === 1) {
    if (b.modoFechas === "fechas") {
      if (!b.fechaIda) e.fechaIda = "Elegí la fecha de ida.";
      else if (diferenciaDias(hoy(), b.fechaIda) < 0) e.fechaIda = "La fecha de ida ya pasó.";
      if (!b.fechaVuelta) e.fechaVuelta = "Elegí la fecha de vuelta.";
      else if (b.fechaIda && diferenciaDias(b.fechaIda, b.fechaVuelta) < 1)
        e.fechaVuelta = "La vuelta tiene que ser al menos un día después de la ida.";
      else if (b.fechaIda && diferenciaDias(b.fechaIda, b.fechaVuelta) > 60)
        e.fechaVuelta = "Por ahora armamos viajes de hasta 60 días.";
    } else {
      const n = Number(b.cantidadDias);
      if (!Number.isInteger(n) || n < 2 || n > 60) e.cantidadDias = "Poné una cantidad entre 2 y 60 días.";
    }
  }
  if (paso === 2) {
    b.viajeros.forEach((v, i) => {
      if (!v.trim()) e[`viajero-${i}`] = "Escribí un nombre.";
    });
    const repetidos = b.viajeros.map((v) => v.trim().toLowerCase()).filter((v, i, arr) => v && arr.indexOf(v) !== i);
    if (repetidos.length) e.viajeros = "Hay nombres repetidos. Usá un apodo o inicial para diferenciarlos.";
  }
  if (paso === 3) {
    const min = Number(b.presupuestoMin || 0);
    const max = Number(b.presupuestoMax);
    if (!b.presupuestoMax || !(max > 0)) e.presupuestoMax = "Indicá cuánto quieren gastar como máximo.";
    if (b.presupuestoMin && !(min >= 0)) e.presupuestoMin = "El mínimo tiene que ser un número.";
    if (max > 0 && min > max) e.presupuestoMin = "El mínimo no puede ser mayor que el máximo.";
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
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-teal-600/40 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-teal-400/40";

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
        className: `${claseCampo} ${error ? "border-red-500 dark:border-red-400" : "border-zinc-300 focus:border-teal-600 dark:border-zinc-700 dark:focus:border-teal-400"}`,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="text-sm text-zinc-600 dark:text-zinc-400">
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
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600/40 ${
                activo
                  ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40"
                  : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
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
                  className={activo ? "text-teal-700 dark:text-teal-400" : "text-zinc-500"}
                  aria-hidden
                />
              )}
              <span>
                <span className="block font-medium">{o.titulo}</span>
                {o.detalle && <span className="block text-sm text-zinc-600 dark:text-zinc-400">{o.detalle}</span>}
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
    const e = validar(paso, b);
    setErrores(e);
    if (Object.keys(e).length) return;
    if (paso < PASOS.length - 1) {
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Paso {paso + 1} de {PASOS.length}
        </p>
        <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Progreso">
          {PASOS.map((nombre, i) => (
            <li
              key={nombre}
              className={`h-1.5 rounded-full transition-colors ${i <= paso ? "bg-teal-700 dark:bg-teal-400" : "bg-zinc-200 dark:bg-zinc-800"}`}
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
          {
            [
              "¿A dónde viajan?",
              "¿Cuándo viajan?",
              "¿Quiénes viajan?",
              "¿Cuánto quieren gastar?",
              "¿Cómo prefieren volar?",
              "¿Dónde quieren dormir?",
              "¿Qué tipo de viaje buscan?",
            ][paso]
          }
        </h1>

        <div key={`c-${paso}`} className="aparecer mt-8 grid gap-6">
          {paso === 0 && (
            <>
              <Campo etiqueta="Origen" error={errores.origen}>
                {(p) => (
                  <input {...p} value={b.origen} onChange={(e) => cambiar("origen", e.target.value)} placeholder="Ej.: Buenos Aires" autoComplete="off" />
                )}
              </Campo>
              <Campo
                etiqueta="Destino"
                error={errores.destino}
                ayuda={
                  destinoResuelto?.tipo === "pais"
                    ? `Pusiste un país: te vamos a sugerir qué ciudades de ${destinoResuelto.pais.nombre} visitar y cuántos días en cada una.`
                    : "Puede ser una ciudad o solo un país. Si ponés un país, te sugerimos las ciudades."
                }
              >
                {(p) => (
                  <input {...p} value={b.destino} onChange={(e) => cambiar("destino", e.target.value)} placeholder="Ej.: China o Roma" autoComplete="off" />
                )}
              </Campo>
            </>
          )}

          {paso === 1 && (
            <>
              <Opciones
                etiqueta="¿Ya tienen fechas?"
                valor={b.modoFechas}
                onCambio={(v) => cambiar("modoFechas", v)}
                opciones={[
                  { valor: "fechas", titulo: "Sí, tengo fechas" },
                  { valor: "dias", titulo: "Solo sé cuántos días" },
                ]}
              />
              {b.modoFechas === "fechas" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Campo etiqueta="Ida" error={errores.fechaIda}>
                    {(p) => <input {...p} type="date" min={hoy()} value={b.fechaIda} onChange={(e) => cambiar("fechaIda", e.target.value)} />}
                  </Campo>
                  <Campo etiqueta="Vuelta" error={errores.fechaVuelta}>
                    {(p) => (
                      <input {...p} type="date" min={b.fechaIda || hoy()} value={b.fechaVuelta} onChange={(e) => cambiar("fechaVuelta", e.target.value)} />
                    )}
                  </Campo>
                </div>
              ) : (
                <Campo
                  etiqueta="Cantidad de días"
                  error={errores.cantidadDias}
                  ayuda="Usamos una fecha tentativa dentro de 30 días. Después la podés cambiar."
                >
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={2} max={60} value={b.cantidadDias} onChange={(e) => cambiar("cantidadDias", e.target.value)} />
                  )}
                </Campo>
              )}
              {noches >= 1 && !errores.fechaVuelta && !errores.cantidadDias && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Son {noches + 1} días y {noches} {noches === 1 ? "noche" : "noches"}.
                </p>
              )}
            </>
          )}

          {paso === 2 && (
            <>
              <p className="-mt-2 text-zinc-600 dark:text-zinc-400">Usamos los nombres para dividir los gastos entre todos.</p>
              {b.viajeros.map((v, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Campo etiqueta={`Viajero ${i + 1}`} error={errores[`viajero-${i}`]}>
                      {(p) => (
                        <input
                          {...p}
                          value={v}
                          autoComplete="off"
                          placeholder={i === 0 ? "Tu nombre" : "Nombre"}
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
                      className={`grid size-11 shrink-0 place-items-center rounded-xl border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 ${errores[`viajero-${i}`] ? "mb-7" : ""}`}
                      aria-label={`Quitar viajero ${i + 1}`}
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
                  className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/50"
                >
                  <Plus size={16} weight="bold" aria-hidden />
                  Sumar viajero
                </button>
              )}
            </>
          )}

          {paso === 3 && (
            <>
              <Opciones<ModoPresupuesto>
                etiqueta="El presupuesto es"
                valor={b.modoPresupuesto}
                onCambio={(v) => cambiar("modoPresupuesto", v)}
                opciones={[
                  { valor: "persona", titulo: "Por persona" },
                  { valor: "total", titulo: "Para todo el grupo" },
                ]}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo etiqueta="Mínimo (US$)" error={errores.presupuestoMin} ayuda="Opcional">
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={0} step={50} value={b.presupuestoMin} onChange={(e) => cambiar("presupuestoMin", e.target.value)} placeholder="Ej.: 1500" />
                  )}
                </Campo>
                <Campo etiqueta="Máximo (US$)" error={errores.presupuestoMax}>
                  {(p) => (
                    <input {...p} type="number" inputMode="numeric" min={0} step={50} value={b.presupuestoMax} onChange={(e) => cambiar("presupuestoMax", e.target.value)} placeholder="Ej.: 3000" />
                  )}
                </Campo>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Te mostramos opciones dentro de ese rango y te avisamos si el viaje se pasa.
              </p>
            </>
          )}

          {paso === 4 && (
            <>
              <Campo etiqueta="Aerolínea preferida" ayuda="Dejalo vacío si les da igual.">
                {(p) => <input {...p} value={b.aerolinea} onChange={(e) => cambiar("aerolinea", e.target.value)} placeholder="Cualquiera" autoComplete="off" />}
              </Campo>
              <Opciones<Clase>
                etiqueta="Clase"
                valor={b.clase}
                onCambio={(v) => cambiar("clase", v)}
                columnas={3}
                opciones={[
                  { valor: "economica", titulo: "Económica" },
                  { valor: "premium", titulo: "Premium economy" },
                  { valor: "business", titulo: "Business" },
                ]}
              />
              <Opciones<Equipaje>
                etiqueta="Equipaje"
                valor={b.equipaje}
                onCambio={(v) => cambiar("equipaje", v)}
                opciones={[
                  { valor: "mano", titulo: "Solo de mano", detalle: "Mochila o carry-on", Icono: Backpack },
                  { valor: "valija", titulo: "Con valija", detalle: "Una valija despachada por persona", Icono: Suitcase },
                ]}
              />
            </>
          )}

          {paso === 5 && (
            <>
              <Opciones<TipoHotel>
                etiqueta="Tipo de alojamiento"
                valor={b.tipoHotel}
                onCambio={(v) => cambiar("tipoHotel", v)}
                columnas={3}
                opciones={[
                  { valor: "hostel", titulo: "Hostel" },
                  { valor: "3", titulo: "Hotel 3 estrellas" },
                  { valor: "4", titulo: "Hotel 4 estrellas" },
                  { valor: "5", titulo: "Hotel 5 estrellas" },
                  { valor: "depto", titulo: "Departamento" },
                ]}
              />
              <Campo etiqueta="Hotel preferido" ayuda="Opcional. Si ya tienen uno en mente, lo sumamos a las opciones.">
                {(p) => <input {...p} value={b.hotelPreferido} onChange={(e) => cambiar("hotelPreferido", e.target.value)} placeholder="Nombre del hotel" autoComplete="off" />}
              </Campo>
            </>
          )}

          {paso === 6 && (
            <Opciones<Plan>
              etiqueta="Estilo"
              valor={b.plan}
              onCambio={(v) => cambiar("plan", v)}
              columnas={3}
              opciones={[
                { valor: "economico", titulo: "Económico", detalle: "Lo más conveniente, aunque tenga escalas" },
                { valor: "equilibrado", titulo: "Equilibrado", detalle: "Buen precio sin resignar comodidad" },
                { valor: "premium", titulo: "Premium", detalle: "Vuelos directos, mejores hoteles y más planes" },
              ]}
            />
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          {paso > 0 ? (
            <button
              type="button"
              onClick={() => {
                setErrores({});
                setPaso(paso - 1);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ArrowLeft size={18} aria-hidden />
              Atrás
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800 active:scale-[0.98] dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
          >
            {paso === PASOS.length - 1 ? "Armar mi viaje" : "Siguiente"}
            <ArrowRight size={18} weight="bold" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
