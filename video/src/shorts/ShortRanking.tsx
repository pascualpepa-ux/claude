import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
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
    dato: "Dato",
    porDia: "por día",
    veces: (caro: string, barato: string, n: number) => `${caro} cuesta más de ${n} veces lo que ${barato}`,
    podio: "El podio del viaje barato",
    desde: (n: number) => `desde US$ ${n} por día`,
    pregunta: "¿Querés ir a la ciudad más barata?",
    proba: "Probá con Rumbo Traveling",
    incluye: ["Vuelos", "Hotel", "Clima real", "Presupuesto", "Quién debe a quién"],
    gratis: "Gratis y sin registrarte",
  },
  en: {
    cejilla: "Budget travel",
    titulo: "Which city is the cheapest to visit?",
    bajada: `${ORDEN.length} destinations, from cheapest to most expensive`,
    lista: "Budget per day",
    nota: "Per person, traveling on a budget, excluding flights. From Rumbo's guides.",
    cierre: "Itinerary and prices for every city, free at",
    firma: "A project by Pascual Pepa",
    dato: "Fun fact",
    porDia: "per day",
    veces: (caro: string, barato: string, n: number) => `${caro} costs more than ${n} times as much as ${barato}`,
    podio: "The budget travel podium",
    desde: (n: number) => `from US$ ${n} per day`,
    pregunta: "Want to visit the cheapest city?",
    proba: "Try Rumbo Traveling",
    incluye: ["Flights", "Hotel", "Real weather", "Budget", "Who owes whom"],
    gratis: "Free, no sign-up",
  },
};


export const DUR_RANKING = { gancho: 105, lista: 330, dato: 120, podio: 150, invitacion: 185, cierre: 130 };
const TR = 10;
export const TOTAL_RANKING = Object.values(DUR_RANKING).reduce((a, b) => a + b, 0) - 5 * TR;

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


/** Dato: la más cara frente a la más barata. */
const Dato: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const barato = ORDEN[0];
  const caro = ORDEN[ORDEN.length - 1];
  const veces = Math.floor(caro.porDia.economico[0] / barato.porDia.economico[0]);
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const a = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 120 } });
  const b = spring({ frame: frame - 16, fps, config: { damping: 14, stiffness: 120 } });
  const caja = (v: number, ciudad: string, monto: number, fuerte: boolean) => (
    <div style={{ flex: 1, padding: "40px 20px", borderRadius: 36, textAlign: "center", backgroundColor: fuerte ? C.oliva700 : C.papel, color: fuerte ? "#fff" : C.arena900, border: `2px solid ${fuerte ? C.oliva700 : C.arena200}`, opacity: v, transform: `scale(${interpolate(v, [0, 1], [0.8, 1])})` }}>
      <div style={{ fontSize: 46, fontWeight: 700 }}>{ciudad}</div>
      <div style={{ marginTop: 16, fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>US$ {monto}</div>
      <div style={{ fontSize: 34, opacity: 0.8 }}>{t.porDia}</div>
    </div>
  );
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ padding: "0 70px 100px", justifyContent: "center" }}>
        <Sube>
          <div style={{ display: "inline-block", padding: "12px 30px", borderRadius: 999, backgroundColor: C.oliva100, color: C.oliva700, fontSize: 40, fontWeight: 700 }}>{t.dato}</div>
        </Sube>
        <Sube desde={4}>
          <div style={{ marginTop: 30, fontSize: 78, lineHeight: 1.08, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textWrap: "balance" }}>
            {t.veces(CIUDAD[caro.slug][idioma], CIUDAD[barato.slug][idioma], veces)}
          </div>
        </Sube>
        <div style={{ marginTop: 60, display: "flex", gap: 30 }}>
          {caja(a, CIUDAD[barato.slug][idioma], barato.porDia.economico[0], true)}
          {caja(b, CIUDAD[caro.slug][idioma], caro.porDia.economico[0], false)}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

/** Podio de las tres más baratas. */
const Podio: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const puestos = [
    { g: ORDEN[1], medalla: "🥈", alto: 330, orden: 0 },
    { g: ORDEN[0], medalla: "🥇", alto: 440, orden: 1 },
    { g: ORDEN[2], medalla: "🥉", alto: 260, orden: 2 },
  ];
  return (
    <Fondo color={C.papel}>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ padding: "0 60px 120px", justifyContent: "center" }}>
        <Sube>
          <div style={{ fontSize: 88, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textAlign: "center" }}>{t.podio}</div>
        </Sube>
        <div style={{ marginTop: 70, display: "flex", alignItems: "flex-end", gap: 22 }}>
          {puestos.map(({ g, medalla, alto }, i) => {
            const v = spring({ frame: frame - 10 - [2, 0, 1][i] * 12, fps, config: { damping: 15, stiffness: 110 } });
            return (
              <div key={g.slug} style={{ flex: 1, textAlign: "center", opacity: v }}>
                <div style={{ fontSize: 100 }}>{medalla}</div>
                <div style={{ marginTop: 8, fontSize: 46, fontWeight: 700, color: C.arena900, lineHeight: 1.1 }}>{CIUDAD[g.slug][idioma]}</div>
                <div style={{ marginTop: 6, fontSize: 30, color: C.arena600 }}>{t.desde(g.porDia.economico[0])}</div>
                <div style={{ marginTop: 20, height: alto * v, borderRadius: "26px 26px 0 0", backgroundColor: i === 1 ? C.oliva700 : C.oliva300 }} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

/** Invitación: "¿Querés ir a la ciudad más barata? Probá con Rumbo" con el viaje real a esa ciudad en un celular. */
const Invitacion: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const tel = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 90 } });
  const ancho = 520;
  const alto = Math.round((ancho * 844) / 390);
  const segunda = interpolate(frame, [95, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Fondo color={C.arena100}>
      <MarcaDeAgua opacidad={0.05} />
      <AbsoluteFill style={{ alignItems: "center", padding: "150px 60px 0" }}>
        <Sube>
          <div style={{ fontSize: 70, lineHeight: 1.08, fontWeight: 700, letterSpacing: -1.5, color: C.oliva800, textAlign: "center", textWrap: "balance" }}>{t.pregunta}</div>
        </Sube>
        <Sube desde={8}>
          <div style={{ marginTop: 18, display: "inline-block", padding: "16px 40px", borderRadius: 26, backgroundColor: C.oliva700, color: "#fff", fontSize: 52, fontWeight: 700 }}>{t.proba}</div>
        </Sube>
        <div style={{ marginTop: 40, display: "flex", gap: 34, alignItems: "flex-start" }}>
          <div style={{ width: ancho + 28, height: alto + 28, padding: 14, borderRadius: 70, backgroundColor: C.arena900, boxShadow: "0 40px 80px rgba(33,31,25,0.3)", transform: `translateY(${interpolate(tel, [0, 1], [500, 0])}px)` }}>
            <div style={{ position: "relative", width: ancho, height: alto, borderRadius: 56, overflow: "hidden" }}>
              <Img src={staticFile(`ranking/${idioma}/viaje-1.png`)} style={{ position: "absolute", inset: 0, width: ancho, height: alto }} />
              <Img src={staticFile(`ranking/${idioma}/viaje-2.png`)} style={{ position: "absolute", inset: 0, width: ancho, height: alto, opacity: segunda }} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 18, marginTop: 30 }}>
            {t.incluye.map((x, i) => {
              const v = spring({ frame: frame - 30 - i * 10, fps, config: { damping: 15, stiffness: 140 } });
              return (
                <div key={x} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderRadius: 999, backgroundColor: C.papel, border: `2px solid ${C.arena200}`, fontSize: 32, fontWeight: 600, color: C.arena900, opacity: v, transform: `translateX(${interpolate(v, [0, 1], [80, 0])}px)` }}>
                  <span style={{ color: C.oliva600 }}>✓</span>
                  {x}
                </div>
              );
            })}
            <div style={{ marginTop: 10, fontSize: 32, fontWeight: 700, color: C.oliva700, opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{t.gratis}</div>
          </div>
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
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.dato}>
          <Dato idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.podio}>
          <Podio idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.invitacion}>
          <Invitacion idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_RANKING.cierre}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com" firma={t.firma} />
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
