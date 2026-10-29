import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import guias from "../datos/guias.json";
import { CierreShort, Gancho, Sube } from "./comunes";

// Short: los consejos de una guía de la web, uno por pantalla.

type G = { slug: string; consejos: Record<Idioma, string>[] };
const DESTINO: Record<string, Record<Idioma, string>> = {
  "japon-7-dias-cuanto-cuesta": { es: "Japón", en: "Japan" },
  "nueva-york-5-dias": { es: "Nueva York", en: "New York" },
  "roma-3-dias": { es: "Roma", en: "Rome" },
};
export const SLUGS_CONSEJOS = Object.keys(DESTINO);

const T = {
  es: {
    cejilla: "Consejos de viaje",
    titulo: (n: number, d: string) => `${n} consejos para viajar a ${d}`,
    bajada: "Lo que conviene saber antes de ir",
    consejo: (i: number) => `Consejo ${i}`,
    cierre: "La guía completa, con itinerario y precios, gratis en",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    cejilla: "Travel tips",
    titulo: (n: number, d: string) => `${n} tips for traveling to ${d}`,
    bajada: "What to know before you go",
    consejo: (i: number) => `Tip ${i}`,
    cierre: "The full guide, with itinerary and prices, free at",
    firma: "A project by Pascual Pepa",
  },
};

export const DUR_CONSEJOS = { gancho: 105, consejo: 135, cierre: 140 };
const TR = 10;
const consejosDe = (slug: string) => (guias as unknown as G[]).find((g) => g.slug === slug)!.consejos;
export const totalConsejos = (slug: string) => {
  const n = consejosDe(slug).length;
  return DUR_CONSEJOS.gancho + n * DUR_CONSEJOS.consejo + DUR_CONSEJOS.cierre - (n + 1) * TR;
};

const Consejo: React.FC<{ numero: number; etiqueta: string; texto: string }> = ({ numero, etiqueta, texto }) => (
  <Fondo>
    <MarcaDeAgua opacidad={0.04} />
    <AbsoluteFill style={{ padding: "0 80px 120px", justifyContent: "center" }}>
      <Sube>
        <div style={{ fontSize: 220, fontWeight: 700, lineHeight: 1, color: C.oliva300 }}>{numero}</div>
      </Sube>
      <Sube desde={4}>
        <div style={{ marginTop: 10, fontSize: 40, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.oliva600 }}>{etiqueta}</div>
      </Sube>
      <Sube desde={10} distancia={70}>
        <div style={{ marginTop: 30, fontSize: 70, lineHeight: 1.18, fontWeight: 600, color: C.arena900, textWrap: "pretty" }}>{texto}</div>
      </Sube>
    </AbsoluteFill>
  </Fondo>
);

export const ShortConsejos: React.FC<{ slug: string; idioma: Idioma }> = ({ slug, idioma }) => {
  const t = T[idioma];
  const consejos = consejosDe(slug);
  const total = totalConsejos(slug);
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR_CONSEJOS.gancho}>
          <Gancho cejilla={t.cejilla} titulo={t.titulo(consejos.length, DESTINO[slug][idioma])} bajada={t.bajada} />
        </TransitionSeries.Sequence>
        {consejos.flatMap((c, i) => [
          <TransitionSeries.Transition key={`t${i}`} presentation={i === 0 ? fade() : slide({ direction: "from-right" })} timing={tiempo} />,
          <TransitionSeries.Sequence key={`c${i}`} durationInFrames={DUR_CONSEJOS.consejo}>
            <Consejo numero={i + 1} etiqueta={t.consejo(i + 1)} texto={c[idioma]} />
          </TransitionSeries.Sequence>,
        ])}
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_CONSEJOS.cierre}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com/guias" firma={t.firma} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        startFrom={0}
        volume={(f) => interpolate(f, [0, 12, total - 45, total], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};
