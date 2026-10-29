import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import guias from "../datos/guias.json";
import voz from "../datos/voz.json";
import { CierreShort, Gancho, Sube } from "./comunes";

// Shorts de las guías de viaje de rumbotraveling.com: gancho, itinerario día por día, precios, presupuesto y cierre.
// Los datos salen de las guías reales de la web (src/datos/guias.json).

type Texto = Record<Idioma, string>;
interface Guia {
  slug: string;
  dias: number;
  titulo: Texto;
  itinerario: { titulo: Texto; actividades: Texto[] }[];
  precios: { concepto: Texto; monto: Texto }[];
  porDia: { economico: [number, number]; equilibrado: [number, number]; premium: [number, number] };
}

const T = {
  es: {
    cejilla: "Guía de viaje",
    bajada: "Itinerario día por día y cuánto cuesta",
    precios: "Cuánto cuesta",
    preciosNota: "Precios aproximados: confirmá antes de pagar.",
    presupuesto: "Presupuesto por persona",
    porDia: "por día, sin vuelo",
    estilos: ["Económico", "Equilibrado", "Premium"],
    total: (d: number) => `Total ${d} días`,
    cierre: "Guía completa gratis y tu viaje armado en",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    cejilla: "Travel guide",
    bajada: "Day-by-day itinerary and what it costs",
    precios: "What it costs",
    preciosNota: "Approximate prices: confirm before paying.",
    presupuesto: "Budget per person",
    porDia: "per day, excluding flights",
    estilos: ["Budget", "Balanced", "Premium"],
    total: (d: number) => `Total for ${d} days`,
    cierre: "Full free guide and your trip planned at",
    firma: "A project by Pascual Pepa",
  },
};

export const DUR = { gancho: 105, dia: 120, precios: 165, presupuesto: 150, cierre: 140 };
const TR = 10;
const guiaDe = (slug: string) => (guias as unknown as Guia[]).find((x) => x.slug === slug)!;
/** Voz en off generada con voces/narrar.ts (si existe para este video). */
const vozDe = (id: string) => (voz as Record<string, { segundos: number[] }>)[id];

/** Duración de cada escena: la de base, o más larga si la voz lo necesita. */
export function duracionesGuia(slug: string, idioma: Idioma): number[] {
  const g = guiaDe(slug);
  const base = [DUR.gancho, ...g.itinerario.map(() => DUR.dia), DUR.precios, DUR.presupuesto, DUR.cierre];
  const v = vozDe(`Guia-${slug}-${idioma}`);
  return v ? base.map((d, i) => Math.max(d, Math.ceil((v.segundos[i] ?? 0) * 30) + 26)) : base;
}
export const duracionGuia = (slug: string, idioma: Idioma = "es") => {
  const d = duracionesGuia(slug, idioma);
  return d.reduce((a, b) => a + b, 0) - (d.length - 1) * TR;
};

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const usd = (n: number, idioma: Idioma) => `US$ ${n.toLocaleString(idioma === "es" ? "es-AR" : "en-US")}`;

const Dia: React.FC<{ etiqueta: string; titulo: string; actividades: string[] }> = ({ etiqueta, titulo, actividades }) => (
  <Fondo>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
      <Sube>
        <div style={{ display: "inline-block", padding: "14px 34px", borderRadius: 999, backgroundColor: C.oliva700, color: "#fff", fontSize: 44, fontWeight: 700 }}>{etiqueta}</div>
      </Sube>
      <Sube desde={6}>
        <div style={{ marginTop: 34, fontSize: 96, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textWrap: "balance" }}>{titulo}</div>
      </Sube>
      <div style={{ marginTop: 60, display: "grid", gap: 26 }}>
        {actividades.slice(0, 3).map((a, i) => (
          <Sube key={i} desde={18 + i * 12} distancia={70}>
            <div style={{ display: "flex", gap: 26, alignItems: "flex-start", padding: "30px 34px", borderRadius: 30, backgroundColor: C.papel, border: `2px solid ${C.arena200}`, boxShadow: "0 18px 40px rgba(70,74,52,0.10)" }}>
              <div style={{ flexShrink: 0, width: 58, height: 58, borderRadius: 29, backgroundColor: C.oliva100, color: C.oliva700, fontSize: 32, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ fontSize: 44, lineHeight: 1.25, color: C.arena900 }}>{a.replace(/\.$/, "")}</div>
            </div>
          </Sube>
        ))}
      </div>
    </AbsoluteFill>
  </Fondo>
);

const Precios: React.FC<{ g: Guia; idioma: Idioma }> = ({ g, idioma }) => (
  <Fondo color={C.papel}>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
      <Sube>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, color: C.oliva800 }}>{T[idioma].precios}</div>
      </Sube>
      <div style={{ marginTop: 50, display: "grid", gap: 22 }}>
        {g.precios.slice(0, 5).map((p, i) => (
          <Sube key={i} desde={10 + i * 10} distancia={60}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 30, padding: "30px 34px", borderRadius: 28, backgroundColor: C.arena50, border: `2px solid ${C.arena200}` }}>
              <div style={{ fontSize: 40, lineHeight: 1.2, color: C.arena900, flex: 1 }}>{p.concepto[idioma]}</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: C.oliva700, textAlign: "right", maxWidth: 380 }}>{p.monto[idioma]}</div>
            </div>
          </Sube>
        ))}
      </div>
      <Sube desde={70}>
        <div style={{ marginTop: 36, fontSize: 32, color: C.arena500 }}>{T[idioma].preciosNota}</div>
      </Sube>
    </AbsoluteFill>
  </Fondo>
);

const Presupuesto: React.FC<{ g: Guia; idioma: Idioma }> = ({ g, idioma }) => {
  const t = T[idioma];
  const filas = [g.porDia.economico, g.porDia.equilibrado, g.porDia.premium];
  const maximo = g.porDia.premium[1];
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
        <Sube>
          <div style={{ fontSize: 92, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2, color: C.oliva800 }}>{t.presupuesto}</div>
        </Sube>
        <Sube desde={6}>
          <div style={{ marginTop: 16, fontSize: 40, color: C.arena600 }}>{t.porDia}</div>
        </Sube>
        <div style={{ marginTop: 60, display: "grid", gap: 46 }}>
          {filas.map(([min, max], i) => (
            <Barra key={i} desde={14 + i * 14} etiqueta={t.estilos[i]} rango={`${usd(min, idioma)}–${usd(max, idioma)}`} total={`${t.total(g.dias)}: ${usd(min * g.dias, idioma)}–${usd(max * g.dias, idioma)}`} ancho={max / maximo} />
          ))}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

const Barra: React.FC<{ desde: number; etiqueta: string; rango: string; total: string; ancho: number }> = ({ desde, etiqueta, rango, total, ancho }) => {
  const v = useEntrada(desde, 90);
  return (
    <div style={{ opacity: Math.min(1, v * 1.5) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 46 }}>
        <span style={{ fontWeight: 700, color: C.arena900 }}>{etiqueta}</span>
        <span style={{ fontWeight: 700, color: C.oliva700 }}>{rango}</span>
      </div>
      <div style={{ marginTop: 16, height: 30, borderRadius: 15, backgroundColor: C.arena200 }}>
        <div style={{ height: 30, borderRadius: 15, width: `${interpolate(v, [0, 1], [0, ancho * 100])}%`, backgroundColor: C.oliva600 }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 32, color: C.arena600 }}>{total}</div>
    </div>
  );
};

export const ShortGuia: React.FC<{ slug: string; idioma: Idioma }> = ({ slug, idioma }) => {
  const g = guiaDe(slug);
  const t = T[idioma];
  const id = `Guia-${slug}-${idioma}`;
  const conVoz = !!vozDe(id);
  const D = duracionesGuia(slug, idioma);
  const total = duracionGuia(slug, idioma);
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  const lado = slide({ direction: "from-right" });
  // La voz de cada escena arranca un poco después de que la escena aparece.
  const Voz: React.FC<{ n: number }> = ({ n }) =>
    conVoz ? (
      <Sequence from={8}>
        <Audio src={staticFile(`voz/${id}/${n}.wav`)} />
      </Sequence>
    ) : null;
  const n0 = g.itinerario.length;
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D[0]}>
          <Gancho cejilla={t.cejilla} titulo={g.titulo[idioma]} bajada={t.bajada} />
          <Voz n={0} />
        </TransitionSeries.Sequence>
        {g.itinerario.flatMap((d, i) => {
          const [etiqueta, ...resto] = d.titulo[idioma].split(":");
          return [
            <TransitionSeries.Transition key={`t${i}`} presentation={i === 0 ? fade() : lado} timing={tiempo} />,
            <TransitionSeries.Sequence key={`d${i}`} durationInFrames={D[i + 1]}>
              <Dia etiqueta={etiqueta.trim()} titulo={mayuscula(resto.join(":").trim() || etiqueta)} actividades={d.actividades.map((a) => a[idioma])} />
              <Voz n={i + 1} />
            </TransitionSeries.Sequence>,
          ];
        })}
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[n0 + 1]}>
          <Precios g={g} idioma={idioma} />
          <Voz n={n0 + 1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[n0 + 2]}>
          <Presupuesto g={g} idioma={idioma} />
          <Voz n={n0 + 2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[n0 + 3]}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com" firma={t.firma} />
          <Voz n={n0 + 3} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        startFrom={0}
        loop
        // Con voz, la música queda de fondo, bajita.
        volume={(f) => interpolate(f, [0, 12, total - 45, total], [0, conVoz ? 0.22 : 0.85, conVoz ? 0.22 : 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};
