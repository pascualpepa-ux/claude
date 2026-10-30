"use client";

import { useEffect, useRef, useState } from "react";
import { ChartBar, ChartLine } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "./ProveedorIdioma";
import { LOCALE } from "@/lib/idioma";

export interface Punto {
  clave: string;
  etiqueta: string; // para el eje y el globo
  valor: number;
}

const ALTO = 240;
const MARGEN = { arriba: 16, derecha: 12, abajo: 28, izquierda: 36 };

/** Escala "linda" para el eje: 1, 2, 5 × 10^n. */
function techo(max: number) {
  if (max <= 4) return 4;
  const pot = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pot >= max) return m * pot;
  return 10 * pot;
}

/** Barra con las esquinas de arriba redondeadas (4px) y la base apoyada en el eje. */
function barra(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

interface Props {
  puntos: Punto[];
  descripcion: string; // para lectores de pantalla
  columnaEtiqueta: string; // encabezado de la tabla ("Día", "Hora")
  modoInicial?: "barras" | "lineas";
  conSelector?: boolean;
  /** Cada cuántos puntos se escribe una etiqueta en el eje: en pantallas angostas (< 480px) y anchas. */
  cadaEtiqueta?: { angosto: number; ancho: number };
  /** Para usar el gráfico con otra cosa que visitantes (por ejemplo, ganancias). */
  columnaValor?: string;
  /** Si los valores son plata: se muestran con esta moneda. */
  moneda?: string;
}

export function GraficoVisitas({ puntos, descripcion, columnaEtiqueta, modoInicial = "barras", conSelector = false, cadaEtiqueta, columnaValor, moneda }: Props) {
  const { idioma, t } = useIdioma();
  const plata = (v: number) => v.toLocaleString(LOCALE[idioma], { style: "currency", currency: moneda ?? "EUR" });
  const [modo, setModo] = useState(modoInicial);
  const [activo, setActivo] = useState<number | null>(null);
  // El dibujo usa el ancho real del contenedor para que el texto no se achique en el celular.
  const caja = useRef<HTMLDivElement>(null);
  const [ANCHO, setAncho] = useState(720);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setAncho(Math.max(280, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const n = puntos.length;
  const cada = cadaEtiqueta
    ? ANCHO < 480
      ? cadaEtiqueta.angosto
      : cadaEtiqueta.ancho
    : Math.max(1, Math.ceil(n / (ANCHO < 480 ? 3 : 5)));
  const max = techo(Math.max(...puntos.map((p) => p.valor), 0));
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const paso = anchoUtil / n;
  const anchoBarra = Math.max(2, paso - 2); // 2px de separación entre barras
  const xCentro = (i: number) => MARGEN.izquierda + i * paso + paso / 2;
  const y = (v: number) => MARGEN.arriba + altoUtil - (v / max) * altoUtil;
  const base = y(0);
  const marcas = [0, max / 2, max];
  const sel = activo === null ? null : puntos[activo];

  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${xCentro(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join("");
  const area = `${linea}L${xCentro(n - 1).toFixed(1)},${base}L${xCentro(0).toFixed(1)},${base}Z`;

  return (
    <figure className="m-0">
      {conSelector && (
        <div role="group" aria-label={t.admin.tipoGrafico} className="mb-3 inline-flex rounded-xl border border-arena-300 p-0.5 text-sm dark:border-arena-700">
          {(
            [
              ["barras", t.admin.barras, ChartBar],
              ["lineas", t.admin.lineas, ChartLine],
            ] as const
          ).map(([valor, texto, Icono]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={modo === valor}
              onClick={() => setModo(valor)}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 font-medium transition ${
                modo === valor
                  ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
                  : "text-arena-600 hover:text-oliva-700 dark:text-arena-400 dark:hover:text-oliva-300"
              }`}
            >
              <Icono size={16} weight="bold" aria-hidden />
              {texto}
            </button>
          ))}
        </div>
      )}

      <div ref={caja} className="relative">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full" role="img" aria-label={descripcion} onMouseLeave={() => setActivo(null)}>
          {marcas.map((m) => (
            <g key={m}>
              <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(m)} y2={y(m)} className="stroke-arena-200 dark:stroke-arena-800" strokeWidth={1} />
              <text x={MARGEN.izquierda - 8} y={y(m)} dy="0.32em" textAnchor="end" className="fill-arena-500 text-[11px] tabular-nums dark:fill-arena-400">
                {Number.isInteger(m) ? m : m.toFixed(1)}
              </text>
            </g>
          ))}

          {modo === "lineas" && (
            <>
              <path d={area} className="fill-oliva-600/10 dark:fill-oliva-300/10" />
              <path d={linea} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-oliva-600 dark:stroke-oliva-300" />
              {activo !== null && (
                <line x1={xCentro(activo)} x2={xCentro(activo)} y1={MARGEN.arriba} y2={base} className="stroke-arena-300 dark:stroke-arena-700" strokeDasharray="3 3" />
              )}
              {/* Punto destacado: el elegido o, si no hay, el último */}
              {(() => {
                const i = activo ?? n - 1;
                return (
                  <circle cx={xCentro(i)} cy={y(puntos[i].valor)} r={4.5} strokeWidth={2} className="fill-oliva-600 stroke-papel dark:fill-oliva-300 dark:stroke-arena-900" />
                );
              })()}
            </>
          )}

          {puntos.map((p, i) => {
            const h = Math.max(0, base - y(p.valor));
            return (
              <g key={p.clave}>
                {modo === "barras" && h > 0 && (
                  <path
                    d={barra(MARGEN.izquierda + i * paso + (paso - anchoBarra) / 2, y(p.valor), anchoBarra, h)}
                    className={`transition-opacity ${activo === null || activo === i ? "opacity-100" : "opacity-40"} fill-oliva-600 dark:fill-oliva-300`}
                  />
                )}
                {/* Zona de toque más grande que la marca */}
                <rect
                  x={MARGEN.izquierda + i * paso}
                  y={MARGEN.arriba}
                  width={paso}
                  height={altoUtil}
                  fill="transparent"
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => setActivo(i)}
                />
                {(i % cada === 0 || (i === n - 1 && i % cada >= cada / 2)) && (
                  <text x={xCentro(i)} y={ALTO - 8} textAnchor="middle" className="fill-arena-500 text-[11px] dark:fill-arena-400">
                    {p.etiqueta}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {sel && activo !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-xl border border-arena-200 bg-papel px-3 py-2 text-sm shadow-md dark:border-arena-700 dark:bg-arena-900"
            style={{
              left: `${(xCentro(activo) / ANCHO) * 100}%`,
              // Cerca de los bordes la etiqueta se corre hacia adentro para no cortarse.
              transform: `translateX(${activo < n * 0.2 ? "-15%" : activo > n * 0.8 ? "-85%" : "-50%"})`,
            }}
          >
            <p className="whitespace-nowrap text-arena-600 dark:text-arena-400">{sel.etiqueta}</p>
            <p className="whitespace-nowrap font-semibold tabular-nums">{moneda ? plata(sel.valor) : t.admin.visitantes(sel.valor)}</p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-arena-600 dark:text-arena-400">{t.admin.verTabla}</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left text-arena-500 dark:text-arena-400">
                <th className="py-1 font-medium">{columnaEtiqueta}</th>
                <th className="py-1 text-right font-medium">{columnaValor ?? t.admin.columnaVisitantes}</th>
              </tr>
            </thead>
            <tbody>
              {[...puntos].reverse().map((p) => (
                <tr key={p.clave} className="border-t border-arena-100 dark:border-arena-800">
                  <td className="py-1">{p.etiqueta}</td>
                  <td className="py-1 text-right">{moneda ? plata(p.valor) : p.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
