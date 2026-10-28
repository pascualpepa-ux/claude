import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { Fondo, MarcaDeAgua, Tarjeta, useEntrada, Ventana } from "../comunes";
import { Cierre } from "../escenas/Cierre";
import { Logo } from "../escenas/Logo";
import { C } from "../marca";
import { TEXTOS, type Idioma, type Textos } from "../textos";

// Short de introducción: vertical 1080x1920, 34 segundos. Mismas piezas que el video largo, acomodadas a lo alto.
export const DURACIONES_SHORT = { logo: 100, pregunta: 92, itinerario: 160, todo: 160, gastos: 160, alertas: 160, cierre: 260 };
const TRANSICION = 12;
export const TOTAL_SHORT = Object.values(DURACIONES_SHORT).reduce((a, b) => a + b, 0) - 6 * TRANSICION;
const suave = Easing.bezier(0.45, 0, 0.2, 1);

/** Título arriba, imagen abajo. */
const Vertical: React.FC<{ cejilla: string; titulo: string; children: React.ReactNode }> = ({ cejilla, titulo, children }) => {
  const a = useEntrada(3);
  const b = useEntrada(8);
  const sube = (v: number) => ({ opacity: v, transform: `translateY(${interpolate(v, [0, 1], [40, 0])}px)` });
  return (
    <Fondo>
      <MarcaDeAgua opacidad={0.04} />
      <div style={{ position: "absolute", top: 190, left: 80, right: 80 }}>
        <div style={{ ...sube(a), display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.oliva600 }}>
          <span style={{ width: 50, height: 6, borderRadius: 3, backgroundColor: C.oliva600 }} />
          {cejilla}
        </div>
        <div style={{ ...sube(b), marginTop: 24, fontSize: 96, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2, color: C.oliva800, textWrap: "balance" }}>{titulo}</div>
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, bottom: 0 }}>{children}</div>
    </Fondo>
  );
};

const Pregunta: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Fondo color={C.papel}>
      <MarcaDeAgua opacidad={0.035} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 30, rowGap: 6, fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, color: C.oliva800, textAlign: "center" }}>
          {texto.split(" ").map((p, i) => {
            const v = spring({ frame: frame - 4 - i * 5, fps, config: { damping: 14, stiffness: 150 } });
            return (
              <span key={i} style={{ display: "inline-block", opacity: v, transform: `translateY(${interpolate(v, [0, 1], [70, 0])}px)` }}>
                {p}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </Fondo>
  );
};

const Itinerario: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const entra = useEntrada(6, 90);
  const baja = interpolate(frame, [25, 150], [0, -1400], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  return (
    <Vertical cejilla={t.itinerario.cejilla} titulo={t.itinerario.titulo}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 20 }}>
        <Ventana ancho={940} alto={1160} estilo={{ opacity: entra, transform: `translateY(${interpolate(entra, [0, 1], [150, 0])}px)` }}>
          <Img src={staticFile(`capturas/${idioma}/itinerario.png`)} style={{ width: 936, transform: `translateY(${baja}px)` }} />
        </Ventana>
      </AbsoluteFill>
    </Vertical>
  );
};

const TodoJunto: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const tarjetas = [
    { src: `capturas/${idioma}/vuelo.png`, top: 20, left: 70, giro: -1.5, desde: 6 },
    { src: `capturas/${idioma}/dia.png`, top: 470, left: 110, giro: 1.5, desde: 18 },
    { src: `capturas/${idioma}/hotel.png`, top: 880, left: 60, giro: -1, desde: 30 },
  ];
  return (
    <Vertical cejilla={t.todo.cejilla} titulo={t.todo.titulo}>
      {tarjetas.map((c, i) => (
        <Entra key={i} {...c} flota={Math.sin((frame + i * 20) / 20) * 6} />
      ))}
    </Vertical>
  );
};

const Entra: React.FC<{ src: string; top: number; left: number; giro: number; desde: number; flota: number }> = ({ src, top, left, giro, desde, flota }) => {
  const v = useEntrada(desde, 110);
  return (
    <div style={{ position: "absolute", top, left, opacity: v, transform: `translateX(${interpolate(v, [0, 1], [600, 0])}px) translateY(${flota}px) rotate(${giro * v}deg)` }}>
      <Tarjeta src={src} ancho={910} />
    </div>
  );
};

const Gastos: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const frame = useCurrentFrame();
  const entra = useEntrada(6, 90);
  const zoom = interpolate(frame, [40, 150], [1, 1.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  return (
    <Vertical cejilla={t.gastos.cejilla} titulo={t.gastos.titulo}>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 40 }}>
        <Ventana ancho={940} alto={1060} estilo={{ opacity: entra, transform: `translateY(${interpolate(entra, [0, 1], [150, 0])}px)` }}>
          <Img src={staticFile(`capturas/${idioma}/gastos.png`)} style={{ width: 936, transformOrigin: "99% 24%", transform: `scale(${zoom})` }} />
        </Ventana>
      </AbsoluteFill>
    </Vertical>
  );
};

const Alertas: React.FC<{ t: Textos; idioma: Idioma }> = ({ t, idioma }) => {
  const noti = useEntrada(10, 130);
  const email = useEntrada(32, 85);
  return (
    <Vertical cejilla={t.alertas.cejilla} titulo={t.alertas.titulo}>
      <div style={{ position: "absolute", top: 300, left: 150, opacity: email, transform: `translateY(${interpolate(email, [0, 1], [300, 0])}px)` }}>
        <Tarjeta src={`capturas/${idioma}/email.png`} ancho={780} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "28px 32px",
          borderRadius: 34,
          backgroundColor: "rgba(255, 253, 247, 0.97)",
          border: `2px solid ${C.arena200}`,
          boxShadow: "0 30px 70px rgba(70, 74, 52, 0.22)",
          opacity: noti,
          transform: `translateY(${interpolate(noti, [0, 1], [-260, 0])}px)`,
        }}
      >
        <Img src={staticFile("marca/icono-512.png")} style={{ width: 96, height: 96, borderRadius: 22 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.arena500 }}>
            <span style={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Rumbo Traveling</span>
            <span>{t.alertas.ahora}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 36, fontWeight: 700, color: C.arena900 }}>{t.alertas.noti}</div>
          <div style={{ marginTop: 4, fontSize: 30, color: C.arena600 }}>{t.alertas.notiDetalle}</div>
        </div>
      </div>
    </Vertical>
  );
};

export const Short: React.FC<{ idioma: Idioma }> = ({ idioma }) => {
  const t = TEXTOS[idioma];
  const D = DURACIONES_SHORT;
  const tiempo = springTiming({ config: { damping: 200 }, durationInFrames: TRANSICION });
  const lado = slide({ direction: "from-right" });
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.logo}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.pregunta}>
          <Pregunta texto={t.pregunta} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.itinerario}>
          <Itinerario t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.todo}>
          <TodoJunto t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.gastos}>
          <Gastos t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lado} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.alertas}>
          <Alertas t={t} idioma={idioma} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={tiempo} />
        <TransitionSeries.Sequence durationInFrames={D.cierre}>
          <Cierre t={t} duracion={D.cierre} vertical />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        src={staticFile("musica/rumbo.wav")}
        volume={(f) =>
          interpolate(f, [0, 15, TOTAL_SHORT - 50, TOTAL_SHORT], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />
    </>
  );
};
