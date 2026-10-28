import { Audio, interpolate, staticFile } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { Cierre } from "./escenas/Cierre";
import { Alertas, Gastos, Idiomas, Itinerario, TodoJunto } from "./escenas/Funciones";
import { Logo } from "./escenas/Logo";
import { Pregunta } from "./escenas/Pregunta";
import { TEXTOS, type Idioma } from "./textos";

// Duración de cada escena en frames (30 por segundo). Con 7 transiciones de 15 frames, el total da 1800 = 60 s.
export const DURACIONES = { logo: 165, pregunta: 135, itinerario: 255, todo: 255, gastos: 255, alertas: 255, idiomas: 225, cierre: 360 };
const TRANSICION = 15;
export const TOTAL = Object.values(DURACIONES).reduce((a, b) => a + b, 0) - 7 * TRANSICION;

export const Promo: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = TEXTOS[idioma];
  const D = DURACIONES;
  const resorte = springTiming({ config: { damping: 200 }, durationInFrames: TRANSICION });
  const lineal = linearTiming({ durationInFrames: TRANSICION });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.logo}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={lineal} />
        <TransitionSeries.Sequence durationInFrames={D.pregunta}>
          <Pregunta texto={t.pregunta} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={resorte} />
        <TransitionSeries.Sequence durationInFrames={D.itinerario}>
          <Itinerario t={t} idioma={idioma} duracion={D.itinerario} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={resorte} />
        <TransitionSeries.Sequence durationInFrames={D.todo}>
          <TodoJunto t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={resorte} />
        <TransitionSeries.Sequence durationInFrames={D.gastos}>
          <Gastos t={t} idioma={idioma} duracion={D.gastos} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={resorte} />
        <TransitionSeries.Sequence durationInFrames={D.alertas}>
          <Alertas t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={resorte} />
        <TransitionSeries.Sequence durationInFrames={D.idiomas}>
          <Idiomas t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={lineal} />
        <TransitionSeries.Sequence durationInFrames={D.cierre}>
          <Cierre t={t} duracion={D.cierre} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio src={staticFile("musica/rumbo.wav")} volume={(f) => interpolate(f, [0, 20], [0, 0.9], { extrapolateRight: "clamp" })} />
    </>
  );
};
