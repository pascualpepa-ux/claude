"use client";

import { useEffect, useRef, useState } from "react";
import { formatoCorto } from "@/lib/fechas";
import type { VisitasDia } from "@/lib/goatcounter";

const ALTO = 240;
const MARGEN = { arriba: 16, derecha: 8, abajo: 28, izquierda: 36 };

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

export function GraficoVisitas({ dias }: { dias: VisitasDia[] }) {
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
  const cadaEtiqueta = ANCHO < 480 ? 14 : 7;
  const max = techo(Math.max(...dias.map((d) => d.visitas), 0));
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const paso = anchoUtil / dias.length;
  const anchoBarra = Math.max(2, paso - 2); // 2px de separación entre barras
  const y = (v: number) => MARGEN.arriba + altoUtil - (v / max) * altoUtil;
  const marcas = [0, max / 2, max];
  const sel = activo === null ? null : dias[activo];

  return (
    <figure className="m-0">
      <div ref={caja} className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Visitantes por día en los últimos ${dias.length} días`}
          onMouseLeave={() => setActivo(null)}
        >
          {marcas.map((m) => (
            <g key={m}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y(m)}
                y2={y(m)}
                className="stroke-zinc-200 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y(m)}
                dy="0.32em"
                textAnchor="end"
                className="fill-zinc-500 text-[11px] tabular-nums dark:fill-zinc-400"
              >
                {Number.isInteger(m) ? m : m.toFixed(1)}
              </text>
            </g>
          ))}

          {dias.map((d, i) => {
            const x = MARGEN.izquierda + i * paso + (paso - anchoBarra) / 2;
            const h = Math.max(0, MARGEN.arriba + altoUtil - y(d.visitas));
            return (
              <g key={d.dia}>
                {h > 0 && (
                  <path
                    d={barra(x, y(d.visitas), anchoBarra, h)}
                    className={`transition-opacity ${
                      activo === null || activo === i ? "opacity-100" : "opacity-40"
                    } fill-teal-600 dark:fill-teal-400`}
                  />
                )}
                {/* Zona de toque más grande que la barra */}
                <rect
                  x={MARGEN.izquierda + i * paso}
                  y={MARGEN.arriba}
                  width={paso}
                  height={altoUtil}
                  fill="transparent"
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => setActivo(i)}
                />
                {(i % cadaEtiqueta === 0 || (i === dias.length - 1 && i % cadaEtiqueta >= cadaEtiqueta / 2)) && (
                  <text
                    x={MARGEN.izquierda + i * paso + paso / 2}
                    y={ALTO - 8}
                    textAnchor="middle"
                    className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
                  >
                    {formatoCorto(d.dia)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {sel && activo !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              left: `${((MARGEN.izquierda + activo * paso + paso / 2) / ANCHO) * 100}%`,
              // Cerca de los bordes la etiqueta se corre hacia adentro para no cortarse.
              transform: `translateX(${activo < dias.length * 0.2 ? "-15%" : activo > dias.length * 0.8 ? "-85%" : "-50%"})`,
            }}
          >
            <p className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">{formatoCorto(sel.dia)}</p>
            <p className="whitespace-nowrap font-semibold tabular-nums">
              {sel.visitas} {sel.visitas === 1 ? "visitante" : "visitantes"}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">Ver como tabla</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-1 font-medium">Día</th>
                <th className="py-1 text-right font-medium">Visitantes</th>
              </tr>
            </thead>
            <tbody>
              {[...dias].reverse().map((d) => (
                <tr key={d.dia} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1">{formatoCorto(d.dia)}</td>
                  <td className="py-1 text-right">{d.visitas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
