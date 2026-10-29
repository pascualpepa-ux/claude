import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import { CierreShort, Gancho } from "./comunes";

// Short tutorial: cómo se arma un viaje en rumbotraveling.com, con capturas reales del asistente en un celular.

const T = {
  es: {
    cejilla: "Tutorial",
    titulo: "Armá tu viaje en 1 minuto",
    bajada: "Así se usa Rumbo Traveling",
    pasos: [
      "Elegí de dónde salís y a dónde vas",
      "Poné las fechas",
      "Sumá a los que viajan",
      "¿Cuánto quieren gastar?",
      "¿Cómo prefieren volar?",
      "¿Dónde quieren dormir?",
      "Elegí el tipo de viaje",
      "¡Listo! Tu viaje armado",
      "Día por día, con el clima real",
      "Y quién le debe a quién",
    ],
    paso: (n: number) => `Paso ${n} de 7`,
    cierre: "Gratis y sin registrarte en",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    cejilla: "Tutorial",
    titulo: "Plan your trip in 1 minute",
    bajada: "How to use Rumbo Traveling",
    pasos: [
      "Pick where you're leaving from and going",
      "Add your dates",
      "Add who's traveling",
      "How much do you want to spend?",
      "How do you like to fly?",
      "Where do you want to stay?",
      "Pick the kind of trip",
      "Done! Your trip is ready",
      "Day by day, with the real weather",
      "And who owes whom",
    ],
    paso: (n: number) => `Step ${n} of 7`,
    cierre: "Free, no sign-up, at",
    firma: "A project by Pascual Pepa",
  },
};

const IMAGENES = ["paso-1", "paso-2", "paso-3", "paso-4", "paso-5", "paso-6", "paso-7", "viaje-1", "viaje-2", "viaje-3"];
const DURACION_PANTALLA = [72, 60, 60, 60, 60, 60, 60, 84, 84, 96];
const INICIOS = DURACION_PANTALLA.map((_, i) => DURACION_PANTALLA.slice(0, i).reduce((a, b) => a + b, 0));
const CRUCE = 8;

export const DUR_TUTORIAL = { gancho: 95, celular: DURACION_PANTALLA.reduce((a, b) => a + b, 0), cierre: 140 };
const TR = 10;
export const TOTAL_TUTORIAL = DUR_TUTORIAL.gancho + DUR_TUTORIAL.celular + DUR_TUTORIAL.cierre - 2 * TR;

const Celular: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const actual = Math.max(0, INICIOS.findLastIndex((ini) => frame >= ini));
  const entra = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const textoEntra = spring({ frame: frame - INICIOS[actual], fps, config: { damping: 16, stiffness: 140 } });
  const ancho = 640;
  const alto = Math.round((ancho * 844) / 390);
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ marginTop: 150, height: 250, width: 920, textAlign: "center" }}>
          {actual < 7 && (
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.oliva600, opacity: textoEntra }}>{t.paso(actual + 1)}</div>
          )}
          <div
            style={{
              marginTop: 14,
              fontSize: 72,
              lineHeight: 1.08,
              fontWeight: 700,
              letterSpacing: -1.5,
              color: C.oliva800,
              textWrap: "balance",
              opacity: textoEntra,
              transform: `translateY(${interpolate(textoEntra, [0, 1], [30, 0])}px)`,
            }}
          >
            {t.pasos[actual]}
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            width: ancho + 36,
            height: alto + 36,
            padding: 18,
            borderRadius: 86,
            backgroundColor: C.arena900,
            boxShadow: "0 50px 100px rgba(33,31,25,0.35)",
            transform: `translateY(${interpolate(entra, [0, 1], [500, 0])}px)`,
          }}
        >
          <div style={{ position: "relative", width: ancho, height: alto, borderRadius: 70, overflow: "hidden", backgroundColor: C.arena50 }}>
            {IMAGENES.map((img, i) => {
              const ini = INICIOS[i];
              const fin = ini + DURACION_PANTALLA[i];
              const opacidad = interpolate(frame, [ini - CRUCE, ini, fin - 1, fin + CRUCE - 1], [0, 1, 1, i === IMAGENES.length - 1 ? 1 : 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              if (opacidad === 0) return null;
              return <Img key={img} src={staticFile(`tutorial/${idioma}/${img}.png`)} style={{ position: "absolute", inset: 0, width: ancho, height: alto, opacity: opacidad }} />;
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

export const ShortTutorial: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR_TUTORIAL.gancho}>
          <Gancho cejilla={t.cejilla} titulo={t.titulo} bajada={t.bajada} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_TUTORIAL.celular}>
          <Celular idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={DUR_TUTORIAL.cierre}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com" firma={t.firma} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        startFrom={0}
        volume={(f) => interpolate(f, [0, 12, TOTAL_TUTORIAL - 45, TOTAL_TUTORIAL], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};
