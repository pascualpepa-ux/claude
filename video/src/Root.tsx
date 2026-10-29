import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { FPS } from "./marca";
import { Promo, TOTAL } from "./Promo";
import { Short, TOTAL_SHORT } from "./short/Short";
import { duracionGuia, ShortGuia } from "./shorts/ShortGuia";
import { ShortGastos, TOTAL_GASTOS } from "./shorts/ShortGastos";
import { ShortRanking, TOTAL_RANKING } from "./shorts/ShortRanking";
import { ShortConcurso, totalConcurso } from "./shorts/ShortConcurso";
import { ShortTutorial, TOTAL_TUTORIAL } from "./shorts/ShortTutorial";
import { ShortConsejos, SLUGS_CONSEJOS, totalConsejos } from "./shorts/ShortConsejos";

import guias from "./datos/guias.json";

// Un Short por cada guía de la web (en español y en inglés).
const GUIAS_SHORT = (guias as { slug: string }[]).map((g) => g.slug);

// La tipografía de la web (Google Sans Flex, licencia OFL), cargada antes de dibujar el primer cuadro.
const esperaFuente = delayRender("Cargando la tipografía de Rumbo");
const fuente = new FontFace("Marca", `url(${staticFile("fuentes/GoogleSansFlex-latin.woff2")}) format("woff2")`, { weight: "100 1000" });
fuente
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(esperaFuente);
  })
  .catch((e) => {
    console.error("No se pudo cargar la tipografía", e);
    continueRender(esperaFuente);
  });

export const Root: React.FC = () => (
  <>
    <Composition id="Promo-es" component={Promo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Promo-en" component={Promo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{ idioma: "en" as const }} />
    <Composition id="Short-es" component={Short} durationInFrames={TOTAL_SHORT} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Short-en" component={Short} durationInFrames={TOTAL_SHORT} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "en" as const }} />
    {GUIAS_SHORT.flatMap((slug) =>
      (["es", "en"] as const).map((idioma) => (
        <Composition
          key={`${slug}-${idioma}`}
          id={`Guia-${slug}-${idioma}`}
          component={ShortGuia}
          durationInFrames={duracionGuia(slug, idioma)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ slug, idioma }}
        />
      )),
    )}
    <Composition id="Gastos-es" component={ShortGastos} durationInFrames={TOTAL_GASTOS} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Gastos-en" component={ShortGastos} durationInFrames={TOTAL_GASTOS} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "en" as const }} />
    <Composition id="Tutorial-es" component={ShortTutorial} durationInFrames={TOTAL_TUTORIAL} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Tutorial-en" component={ShortTutorial} durationInFrames={TOTAL_TUTORIAL} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "en" as const }} />
    <Composition id="Ranking-es" component={ShortRanking} durationInFrames={TOTAL_RANKING} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Ranking-en" component={ShortRanking} durationInFrames={TOTAL_RANKING} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "en" as const }} />
    <Composition id="Concurso-es" component={ShortConcurso} durationInFrames={totalConcurso("es")} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="Concurso-en" component={ShortConcurso} durationInFrames={totalConcurso("en")} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "en" as const }} />
    {SLUGS_CONSEJOS.flatMap((slug) =>
      (["es", "en"] as const).map((idioma) => (
        <Composition
          key={`consejos-${slug}-${idioma}`}
          id={`Consejos-${slug}-${idioma}`}
          component={ShortConsejos}
          durationInFrames={totalConsejos(slug)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ slug, idioma }}
        />
      )),
    )}
  </>
);
