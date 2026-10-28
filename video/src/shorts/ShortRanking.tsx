import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua, useEntrada } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import guias from "../datos/guias.json";
import { CierreShort, Gancho, Sube } from "./comunes";

// Short: las 10 ciudades de las guías ordenadas de la más barata a la más cara
// (presupuesto económico por persona y por día, sin vuelo, tal cual figura en cada guía de la web).

const CIUDAD: Record<string, Record<Idioma, string>> = {
  "roma-3-dias": { es: "Roma", en: "Rome" },
  "paris-4-dias": { es: "París", en: "Paris" },
  "madrid-3-dias": { es: "Madrid", en: "Madrid" },
  "barcelona-3-dias": { es: "Barcelona", en: "Barcelona" },
  "londres-4-dias": { es: "Londres", en: "London" },
  "nueva-york-5-dias": { es: "Nueva York", en: "New York" },
  "pekin-5-dias": { es: "Pekín", en: "Beijing" },
  "japon-7-dias-cuanto-cuesta": { es: "Japón", en: "Japan" },
  "lisboa-3-dias": { es: "Lisboa", en: "Lisbon" },
  "rio-de-janeiro-4-dias": { es: "Río de Janeiro", en: "Rio de Janeiro" },
  "cancun-5-dias": { es: "Cancún", en: "Cancún" },
  "miami-4-dias": { es: "Miami", en: "Miami" },
  "punta-cana-5-dias": { es: "Punta Cana", en: "Punta Cana" },
  "bariloche-4-dias": { es: "Bariloche", en: "Bariloche" },
};

type G = { slug: string; porDia: { economico: [number, number] } };
const ORDEN = (guias as unknown as G[]).slice().sort((a, b) => a.porDia.economico[0] - b.porDia.economico[0] || a.porDia.economico[1] - b.porDia.economico[1]);

const T = {
  es: {
    cejilla: "Viajar barato",
    titulo: "¿Qué ciudad es la más barata para viajar?",
    bajada: `${ORDEN.length} destinos, de la más barata a la más cara`,
    lista: "Presupuesto por día",
    nota: "Por persona, viajando económico, sin el vuelo. Según las guías de Rumbo.",
    cierre: "Itinerario y precios de cada ciudad, gratis en",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    cejilla: "Budget travel",
    titulo: "Which city is the cheapest to visit?",
    bajada: `${ORDEN.length} destinations, from cheapest to most expensive`,
    lista: "Budget per day",
    nota: "Per person, traveling on a budget, excluding flights. From Rumbo's guides.",
    cierre: "Itinerary and prices for every city, free at",
    firma: "A project by Pascual Pepa",
  },
};


export const DUR_RANKING = { gancho: 105, lista: 360, cierre: 140 };
const TR = 10;
export const TOTAL_RANKING = DUR_RANKING.gancho + DUR_RANKING.lista + DUR_RANKING.cierre - 2 * TR;

const Fila: React.FC<{ puesto: number; ciudad: string; min: number; max: number; maximo: number; desde: number }> = ({ puesto, ciudad, min, max, maximo, desde }) => {
  const v = useEntrada(desde, 120);
  const podio = puesto <= 3;
  return (
    <div style={{ opacity: Math.min(1, v * 1.4), transform: `translateX(${interpolate(v, [0, 1], [80, 0])}px)` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontSize: 40 }}>
        <span style={{ width: 54, fontWeight: 700, color: podio ? C.oliva600 : C.arena500 }}>{puesto}.</span>
        <span style={{ flex: 1, fontWeight: 700, color: C.arena900 }}>{ciudad}</span>
        <span style={{ fontWeight: 700, color: podio ? C.oliva700 : C.arena600 }}>
          US$ {min}–{max}
        </span>
      </div>
      <div style={{ marginTop: 8, marginLeft: 72, height: 16, borderRadius: 8, backgroundColor: C.arena200 }}>
        <div style={{ height: 16, borderRadius: 8, width: `${interpolate(v, [0, 1], [0, (max / maximo) * 100])}%`, backgroundColor: podio ? C.oliva600 : C.arena400 }} />
      </div>
    </div>
  );
};

const Lista: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const frame = useCurrentFrame();
  const maximo = Math.max(...ORDEN.map((g) => g.porDia.economico[1]));
  return (
    <Fondo color={C.papel}>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ padding: "0 70px 80px", justifyContent: "center" }}>
        <Sube>
          <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2, color: C.oliva800 }}>{t.lista}</div>
        </Sube>
        <div style={{ marginTop: 34, display: "grid", gap: ORDEN.length > 10 ? 16 : 28 }}>
          {ORDEN.map((g, i) => (
            <Fila key={g.slug} puesto={i + 1} ciudad={CIUDAD[g.slug][idioma]} min={g.porDia.economico[0]} max={g.porDia.economico[1]} maximo={maximo} desde={12 + i * (ORDEN.length > 10 ? 11 : 14)} />
          ))}
        </div>
        <div style={{ marginTop: 36, fontSize: 30, lineHeight: 1.3, color: C.arena500, opacity: interpolate(frame, [170, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {t.nota}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

export const ShortRanking: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.gancho}>
          <Gancho cejilla={t.cejilla} titulo={t.titulo} bajada={t.bajada} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.lista}>
          <Lista idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.cierre}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com/guias" firma={t.firma} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        startFrom={30 * 8}
        volume={(f) => interpolate(f, [0, 12, TOTAL_RANKING - 45, TOTAL_RANKING], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};
