import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { Fondo, MarcaDeAgua } from "../comunes";
import { C } from "../marca";
import type { Idioma } from "../textos";
import voz from "../datos/voz.json";
import { CierreShort, Sube } from "./comunes";

// Short del concurso: 3 días en Europa para 2. Con voz en off (Piper) y música propia (musica/concurso.wav).

const T = {
  es: {
    alerta: "¡Alerta de concurso!",
    titulo: "Ganate un viaje a Europa para 2",
    premio: [
      { icono: "✈️", texto: "Vuelo de ida y vuelta" },
      { icono: "🏨", texto: "Hotel" },
      { icono: "🎟️", texto: "Planes incluidos" },
    ],
    dias: "3 días · vos + un acompañante",
    como: "Cómo participar",
    pasos: ["Suscribite gratis en Rumbo Traveling", "Compartí tu link con amigos y familia", "Cada amigo que se suscribe = 1 chance más"],
    cierre: "Participás hasta el 15 de noviembre",
    firma: "Un proyecto de Pascual Pepa",
  },
  en: {
    alerta: "Contest alert!",
    titulo: "Win a trip to Europe for 2",
    premio: [
      { icono: "✈️", texto: "Round-trip flights" },
      { icono: "🏨", texto: "Hotel" },
      { icono: "🎟️", texto: "Activities included" },
    ],
    dias: "3 days · you + a companion",
    como: "How to enter",
    pasos: ["Subscribe to Rumbo Traveling for free", "Share your link with friends and family", "Every friend who subscribes = 1 more chance"],
    cierre: "Enter by November 15",
    firma: "A project by Pascual Pepa",
  },
};

const TR = 10;
const BASE = [110, 140, 200, 150];
const segundos = (idioma: Idioma) => (voz as Record<string, { segundos: number[] }>)[`Concurso-${idioma}`]?.segundos ?? [];
/** Cada escena dura lo de base, o más si la voz lo necesita. */
export const duracionesConcurso = (idioma: Idioma) => BASE.map((d, i) => Math.max(d, Math.ceil((segundos(idioma)[i] ?? 0) * 30) + 30));
export const totalConcurso = (idioma: Idioma) => duracionesConcurso(idioma).reduce((a, b) => a + b, 0) - 3 * TR;

const Alerta: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const regalo = spring({ frame: frame - 4, fps, config: { damping: 9, stiffness: 120 } });
  const latido = 1 + 0.05 * Math.sin(frame / 5);
  return (
    <Fondo color={C.oliva800}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px", textAlign: "center" }}>
        <div style={{ fontSize: 230, transform: `scale(${regalo * latido}) rotate(${interpolate(regalo, [0, 1], [-25, 0])}deg)` }}>🎁</div>
        <Sube desde={8}>
          <div style={{ marginTop: 30, display: "inline-block", padding: "14px 34px", borderRadius: 999, backgroundColor: "#fcd34d", color: C.arena900, fontSize: 46, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
            {t.alerta}
          </div>
        </Sube>
        <Sube desde={16}>
          <div style={{ marginTop: 40, fontSize: 118, lineHeight: 1.02, fontWeight: 700, letterSpacing: -3, color: C.arena50, textWrap: "balance" }}>{t.titulo}</div>
        </Sube>
      </AbsoluteFill>
    </Fondo>
  );
};

const Premio: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>
        <div style={{ display: "grid", gap: 30 }}>
          {t.premio.map((p, i) => {
            const v = spring({ frame: frame - 6 - i * 14, fps, config: { damping: 14, stiffness: 130 } });
            return (
              <div
                key={p.texto}
                style={{ display: "flex", alignItems: "center", gap: 34, padding: "34px 40px", borderRadius: 36, backgroundColor: C.papel, border: `2px solid ${C.arena200}`, opacity: v, transform: `translateX(${interpolate(v, [0, 1], [160, 0])}px)` }}
              >
                <span style={{ fontSize: 96 }}>{p.icono}</span>
                <span style={{ fontSize: 64, fontWeight: 700, color: C.oliva800, lineHeight: 1.1 }}>{p.texto}</span>
              </div>
            );
          })}
        </div>
        <Sube desde={50}>
          <div style={{ marginTop: 56, padding: "28px 36px", borderRadius: 32, backgroundColor: C.oliva700, color: "#fff", fontSize: 54, fontWeight: 700, textAlign: "center" }}>{t.dias}</div>
        </Sube>
      </AbsoluteFill>
    </Fondo>
  );
};

const Como: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Fondo color={C.papel}>
      <MarcaDeAgua opacidad={0.04} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px" }}>
        <Sube>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, color: C.oliva800 }}>{t.como}</div>
        </Sube>
        <div style={{ marginTop: 50, display: "grid", gap: 34 }}>
          {t.pasos.map((p, i) => {
            const v = spring({ frame: frame - 12 - i * 40, fps, config: { damping: 15, stiffness: 120 } });
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 30, opacity: v, transform: `translateY(${interpolate(v, [0, 1], [60, 0])}px)` }}>
                <span style={{ flexShrink: 0, display: "grid", placeItems: "center", width: 104, height: 104, borderRadius: 999, backgroundColor: C.oliva700, color: "#fff", fontSize: 56, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.15, color: C.arena900 }}>{p}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

export const ShortConcurso: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = T[idioma];
  const D = duracionesConcurso(idioma);
  const total = totalConcurso(idioma);
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TR });
  const Voz: React.FC<{ n: number }> = ({ n }) => (
    <Sequence from={8}>
      <Audio src={staticFile(`voz/Concurso-${idioma}/${n}.wav`)} />
    </Sequence>
  );
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D[0]}>
          <Alerta idioma={idioma} />
          <Voz n={0} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[1]}>
          <Premio idioma={idioma} />
          <Voz n={1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[2]}>
          <Como idioma={idioma} />
          <Voz n={2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D[3]}>
          <CierreShort frase={t.cierre} url="rumbotraveling.com" firma={t.firma} />
          <Voz n={3} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/concurso.wav")}
        // Con voz, la música queda de fondo.
        volume={(f) => interpolate(f, [0, 12, total - 45, total], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};
