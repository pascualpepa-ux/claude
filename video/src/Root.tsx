import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { FPS } from "./marca";
import { Promo, TOTAL } from "./Promo";
import { Short, TOTAL_SHORT } from "./short/Short";

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
  </>
);
