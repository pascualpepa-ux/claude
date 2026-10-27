"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AirplaneTakeoff, MapPin } from "@phosphor-icons/react/dist/ssr";
import { LOCALE } from "@/lib/idioma";
import type { Lugar } from "@/lib/lugares-tipos";
import { useIdioma } from "./ProveedorIdioma";

interface Props {
  tipo: "origen" | "destino";
  texto: string;
  lugar: Lugar | null;
  aeropuerto: string;
  error?: string;
  onTexto: (texto: string) => void;
  onLugar: (lugar: Lugar) => void;
  onAeropuerto: (iata: string) => void;
}

/**
 * Busca la ciudad de salida o el destino y muestra los aeropuertos con vuelos regulares más cercanos.
 * En el destino también se puede elegir un país: la web sugiere después qué ciudades visitar.
 */
export function BuscadorCiudad({ tipo, texto, lugar, aeropuerto, error, onTexto, onLugar, onAeropuerto }: Props) {
  const { idioma, t } = useIdioma();
  const A = t.asistente;
  const esDestino = tipo === "destino";
  const textos = esDestino
    ? { etiqueta: A.destino, ejemplo: A.destinoEj, ayuda: A.destinoAyuda, aeropuerto: A.aeropuertoLlegada, cambiar: A.cambiarDestino }
    : { etiqueta: A.origen, ejemplo: A.origenEj, ayuda: A.origenAyuda, aeropuerto: A.aeropuertoSalida, cambiar: A.cambiarCiudad };
  const id = useId();
  const [resultados, setResultados] = useState<Lugar[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [estado, setEstado] = useState<"quieto" | "buscando" | "vacio" | "error">("quieto");
  const ultimaBusqueda = useRef("");

  const paises = useMemo(() => {
    try {
      return new Intl.DisplayNames([LOCALE[idioma]], { type: "region" });
    } catch {
      return null;
    }
  }, [idioma]);
  const pais = (codigo: string) => paises?.of(codigo) ?? codigo;
  const ubicacion = (l: Lugar) => (l.region ? `${l.region}, ${pais(l.pais)}` : pais(l.pais));
  const titulo = (l: Lugar) => (l.tipo === "pais" ? pais(l.pais) : l.ciudad);

  // Busca mientras se escribe (con una pequeña espera para no pedir en cada tecla).
  useEffect(() => {
    const q = texto.trim();
    if (lugar || q.length < 2) {
      setResultados([]);
      setEstado("quieto");
      return;
    }
    ultimaBusqueda.current = q;
    setEstado("buscando");
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lugares?q=${encodeURIComponent(q)}${esDestino ? "&tipo=destino" : ""}`, {
          signal: control.signal,
        });
        const { lugares } = (await res.json()) as { lugares: Lugar[] };
        if (ultimaBusqueda.current !== q) return;
        setResultados(lugares);
        setActivo(0);
        setEstado(lugares.length ? "quieto" : "vacio");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setEstado("error");
      }
    }, 220);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [texto, lugar, esDestino]);

  const elegir = (l: Lugar) => {
    onLugar(l);
    setAbierto(false);
    setResultados([]);
  };

  const listaId = `${id}-lista`;
  const mostrarLista = abierto && !lugar && resultados.length > 0;
  const borde = error ? "border-red-500 dark:border-red-400" : "border-arena-300 focus:border-oliva-600 dark:border-arena-700 dark:focus:border-oliva-300";

  return (
    <div className="grid gap-2">
      <label htmlFor={`${id}-campo`} className="text-sm font-medium">
        {textos.etiqueta}
      </label>

      {!lugar ? (
        <div className="relative">
          <input
            id={`${id}-campo`}
            role="combobox"
            aria-expanded={mostrarLista}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-activedescendant={mostrarLista ? `${id}-op-${activo}` : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-ayuda`}
            autoComplete="off"
            value={texto}
            placeholder={textos.ejemplo}
            onChange={(e) => {
              onTexto(e.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            onKeyDown={(e) => {
              if (!mostrarLista) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActivo((a) => Math.min(a + 1, resultados.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActivo((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                elegir(resultados[activo]);
              } else if (e.key === "Escape") setAbierto(false);
            }}
            className={`w-full rounded-xl border bg-papel px-3.5 py-2.5 text-base text-arena-900 placeholder:text-arena-500 transition focus:outline-none focus:ring-2 focus:ring-oliva-600/40 dark:bg-arena-900 dark:text-arena-100 dark:focus:ring-oliva-300/40 ${borde}`}
          />
          {mostrarLista && (
            <ul
              id={listaId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-arena-200 bg-papel p-1 shadow-lg shadow-arena-400/20 dark:border-arena-700 dark:bg-arena-900 dark:shadow-black/40"
            >
              {resultados.map((l, i) => (
                <li
                  key={`${l.tipo}-${l.ciudad}-${l.pais}-${i}`}
                  id={`${id}-op-${i}`}
                  role="option"
                  aria-selected={i === activo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(l);
                  }}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                    i === activo ? "bg-oliva-50 dark:bg-oliva-950/50" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{titulo(l)}</span>
                    <span className="block text-xs text-arena-600 dark:text-arena-400">
                      {l.tipo === "pais" ? A.pais : ubicacion(l)}
                    </span>
                  </span>
                  {l.tipo === "pais" && l.ciudades?.length ? (
                    <span className="max-w-[45%] shrink-0 truncate text-right text-xs text-arena-600 dark:text-arena-400">
                      {l.ciudades.map((c) => c.ciudad).join(", ")}
                    </span>
                  ) : null}
                  {l.tipo === "ciudad" && l.aeropuertos[0] && (
                    <span className="shrink-0 text-right text-xs text-arena-600 tabular-nums dark:text-arena-400">
                      <span className="font-semibold text-oliva-700 dark:text-oliva-300">{l.aeropuertos[0].iata}</span>{" "}
                      {A.aKm(l.aeropuertos[0].distanciaKm)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-arena-300 bg-papel p-3.5 dark:border-arena-700 dark:bg-arena-900">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-medium">
              <MapPin size={18} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
              {lugar.tipo === "pais" ? pais(lugar.pais) : `${lugar.ciudad}, ${ubicacion(lugar)}`}
            </p>
            <button
              type="button"
              onClick={() => onTexto(titulo(lugar))}
              className="shrink-0 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300"
            >
              {textos.cambiar}
            </button>
          </div>

          {lugar.tipo === "pais" ? (
            <p className="mt-2 text-sm text-arena-600 dark:text-arena-400">{A.destinoPais(pais(lugar.pais))}</p>
          ) : lugar.aeropuertos.length ? (
            <fieldset className="mt-3">
              <legend className="mb-2 text-sm text-arena-600 dark:text-arena-400">{textos.aeropuerto}</legend>
              <div className="grid gap-2">
                {lugar.aeropuertos.map((a, i) => (
                  <label
                    key={a.iata}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-oliva-600/40 ${
                      aeropuerto === a.iata
                        ? "border-oliva-700 bg-oliva-50 dark:border-oliva-300 dark:bg-oliva-950/40"
                        : "border-arena-300 hover:border-arena-400 dark:border-arena-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-aeropuerto`}
                      value={a.iata}
                      checked={aeropuerto === a.iata}
                      onChange={() => onAeropuerto(a.iata)}
                      className="sr-only"
                    />
                    <AirplaneTakeoff
                      size={20}
                      weight="duotone"
                      className={aeropuerto === a.iata ? "text-oliva-700 dark:text-oliva-300" : "text-arena-500"}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {a.nombre} ({a.iata})
                      </span>
                      <span className="block text-xs text-arena-600 dark:text-arena-400">
                        {A.aKm(a.distanciaKm)}
                        {i === 0 && lugar.aeropuertos.length > 1 && `, ${A.masCercano.toLowerCase()}`}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="mt-3 text-sm text-red-700 dark:text-red-400">{A.sinAeropuerto}</p>
          )}
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : (
        !lugar && (
          <p id={`${id}-ayuda`} className="text-sm text-arena-600 dark:text-arena-400" aria-live="polite">
            {estado === "buscando"
              ? A.buscando
              : estado === "vacio"
                ? A.sinResultados
                : estado === "error"
                  ? A.errorBusqueda
                  : textos.ayuda}
          </p>
        )
      )}
    </div>
  );
}
